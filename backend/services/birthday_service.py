"""Birthday coupons: once per day, generate and email a personalized coupon to
any customer whose birthday is today.

A `birthday_coupons` collection tracks (customer_id, year) dedupe keys so a
customer only gets one birthday coupon per calendar year, even if the scheduler
fires multiple times or the server restarts mid-sweep.
"""
import uuid
from datetime import datetime, timezone, timedelta

from core.config import db, logger
from core.security import strip_html
from services.email_service import send_coupon_email


def _today_mmdd_and_year(now: datetime = None):
    now = now or datetime.now(timezone.utc)
    return now.strftime("%m-%d"), now.year


def _normalize_mmdd(raw: str):
    """Accept 'MM-DD', 'YYYY-MM-DD', or 'MM/DD' and return canonical 'MM-DD' or None."""
    if not raw:
        return None
    s = str(raw).strip().replace("/", "-")
    if len(s) == 10 and s[4] == "-":  # YYYY-MM-DD
        s = s[5:]
    if len(s) != 5 or s[2] != "-":
        return None
    try:
        month = int(s[:2])
        day = int(s[3:])
        if 1 <= month <= 12 and 1 <= day <= 31:
            return f"{month:02d}-{day:02d}"
    except ValueError:
        pass
    return None


async def process_birthday_coupons():
    """Generate + email one personalized coupon per customer whose birthday is today.

    Runs once per UTC calendar day (guarded via settings.birthday_coupons_last_run).
    """
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0}) or {}
    if not settings.get("birthday_coupons_enabled"):
        return

    today_mmdd, today_year = _today_mmdd_and_year()
    today_iso_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Daily guard
    if settings.get("birthday_coupons_last_run") == today_iso_date:
        return

    discount_percent = float(settings.get("birthday_discount_percent") or 15) or 15.0
    valid_days = int(settings.get("birthday_valid_days") or 14) or 14
    business_name = strip_html(settings.get("business_name", "TECHZONE"))

    customers = await db.customers.find(
        {"birthday": {"$exists": True, "$ne": None}},
        {"_id": 0},
    ).to_list(10000)

    created = 0
    for c in customers:
        mmdd = _normalize_mmdd(c.get("birthday"))
        if not mmdd or mmdd != today_mmdd:
            continue

        # Dedupe per customer per year
        dedupe_key = f"{c['id']}:{today_year}"
        already = await db.birthday_coupons.find_one({"key": dedupe_key})
        if already:
            continue

        code = f"BDAY-{c['id'][:4].upper()}-{today_year}"
        valid_until = (datetime.now(timezone.utc) + timedelta(days=valid_days)).isoformat()
        coupon_doc = {
            "id": str(uuid.uuid4()),
            "code": code,
            "description": f"Happy Birthday from {business_name}! Your personal {int(discount_percent)}% off.",
            "discount_type": "percentage",
            "discount_value": discount_percent,
            "min_purchase": 0,
            "max_discount": None,
            "usage_limit": 1,
            "usage_count": 0,
            "is_active": True,
            "valid_from": datetime.now(timezone.utc).isoformat(),
            "valid_until": valid_until,
            "customer_id": c["id"],
            "customer_name": c.get("name"),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": "birthday-scheduler",
            "source": "birthday",
        }

        # Insert coupon; if unique code collides (same customer retriggered), skip
        try:
            await db.coupons.insert_one(coupon_doc)
        except Exception as e:
            logger.warning(f"Birthday coupon insert skipped for {c['id']}: {e}")
            continue

        # Mark dedupe
        await db.birthday_coupons.insert_one({
            "key": dedupe_key,
            "customer_id": c["id"],
            "year": today_year,
            "coupon_id": coupon_doc["id"],
            "coupon_code": code,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

        # Email it if we have an email on file
        if c.get("email"):
            try:
                send_coupon_email(
                    to_email=c["email"],
                    customer_name=c.get("name", "Valued Customer"),
                    coupon=coupon_doc,
                    business_name=business_name,
                )
            except Exception as e:
                logger.warning(f"Birthday coupon email failed for {c.get('email')}: {e}")

        created += 1

    # Mark the daily run so we don't resweep in the same UTC day
    await db.settings.update_one(
        {"id": "app_settings"},
        {"$set": {"birthday_coupons_last_run": today_iso_date}},
        upsert=True,
    )
    if created:
        logger.info(f"Birthday coupons swept: {created} coupon(s) created for {today_mmdd}.")
