"""Background scheduler: hourly check for auto-email summary reports."""
import asyncio
from datetime import datetime, timezone

from core.config import db, logger
from core.security import strip_html
from services.summary_service import build_summary_pdf, send_summary_email
from routes.reports import _period_range


async def _maybe_send(period: str, enabled_key: str, last_key: str):
    """Send a summary if enabled and not already sent for the current period window."""
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    if not settings:
        return
    if not settings.get(enabled_key):
        return

    to_email = settings.get("shift_report_email")
    if not to_email:
        return

    start, end, label = _period_range(period)
    last_sent_iso = settings.get(last_key)

    if last_sent_iso:
        try:
            last_sent = datetime.fromisoformat(last_sent_iso.replace("Z", "+00:00"))
        except ValueError:
            last_sent = None
        # Already sent for this window (last_sent >= end)
        if last_sent and last_sent >= end:
            return

    business_name = strip_html(settings.get("business_name", "TECHZONE"))
    try:
        pdf_bytes = await build_summary_pdf(label, start, end)
        sent = send_summary_email(to_email, pdf_bytes, label, start, end, business_name)
        if sent:
            await db.settings.update_one(
                {"id": "app_settings"},
                {"$set": {last_key: datetime.now(timezone.utc).isoformat()}},
                upsert=True,
            )
            logger.info(f"Auto-summary sent: {label} → {to_email}")
    except Exception as e:
        logger.error(f"Auto-summary task failed ({period}): {e}")


async def _process_followups():
    """Send any pending follow-up emails whose send_at has passed."""
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        cursor = db.followups.find(
            {"status": "pending", "send_at": {"$lte": now_iso}},
            {"_id": 0},
        ).limit(50)
        followups = await cursor.to_list(50)
        if not followups:
            return

        settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0}) or {}
        business_name = strip_html(settings.get("business_name", "TECHZONE"))
        review_url = (settings.get("google_review_url") or "").strip() or None
        from services.email_service import send_followup_email

        for f in followups:
            sent = send_followup_email(
                to_email=f["customer_email"],
                customer_name=f.get("customer_name", "Valued Customer"),
                items_summary=f.get("items_summary", "your order"),
                business_name=business_name,
                days_ago=int(f.get("days", 14)),
                review_url=review_url,
            )
            status = "sent" if sent else "failed"
            await db.followups.update_one(
                {"id": f["id"]},
                {"$set": {"status": status, "sent_at": datetime.now(timezone.utc).isoformat()}},
            )
    except Exception as e:
        logger.error(f"Follow-up processor error: {e}")


async def summary_scheduler_loop(interval_seconds: int = 3600):
    """Wake every hour and send weekly/monthly summaries + process follow-ups."""
    while True:
        try:
            await _maybe_send(
                "weekly",
                "auto_summary_weekly_enabled",
                "auto_summary_last_weekly_sent",
            )
            await _maybe_send(
                "monthly",
                "auto_summary_monthly_enabled",
                "auto_summary_last_monthly_sent",
            )
            await _process_followups()
        except Exception as e:
            logger.error(f"Scheduler iteration error: {e}")
        await asyncio.sleep(interval_seconds)


def start_scheduler(app):
    """Attach scheduler startup/shutdown handlers to the FastAPI app."""
    task_holder = {}

    @app.on_event("startup")
    async def _start_scheduler():
        task_holder["task"] = asyncio.create_task(summary_scheduler_loop())
        logger.info("Summary email scheduler started (hourly).")

    @app.on_event("shutdown")
    async def _stop_scheduler():
        t = task_holder.get("task")
        if t:
            t.cancel()
