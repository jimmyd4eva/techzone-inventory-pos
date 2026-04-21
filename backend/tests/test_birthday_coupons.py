"""Regression tests for birthday coupons scheduler + sweep endpoint."""
import os
import pytest
import requests
from datetime import datetime, timezone

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8001")
API = f"{BACKEND_URL}/api"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(
        f"{API}/auth/login",
        json={"username": "admin", "password": "admin123"},
        timeout=10,
    )
    r.raise_for_status()
    return r.json()["token"]


@pytest.fixture
def headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


class TestBirthdayCoupons:
    def test_01_customer_persists_birthday(self, headers):
        r = requests.post(
            f"{API}/customers",
            json={
                "name": "Birthday Regress",
                "phone": "876-555-9901",
                "email": "bday_reg_01@test.com",
                "birthday": "12-25",
            },
            headers=headers,
            timeout=10,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["birthday"] == "12-25", "Customer POST must persist birthday field"
        requests.delete(f"{API}/customers/{data['id']}", headers=headers)

    def test_02_sweep_creates_personalized_coupon_for_todays_birthday(self, headers):
        today_mmdd = datetime.now(timezone.utc).strftime("%m-%d")
        year = datetime.now(timezone.utc).year

        # Create customer with today's birthday
        r = requests.post(
            f"{API}/customers",
            json={
                "name": "Today Bday",
                "phone": "876-555-9902",
                "email": "bday_reg_02@test.com",
                "birthday": today_mmdd,
            },
            headers=headers, timeout=10,
        )
        assert r.status_code == 200
        customer_id = r.json()["id"]

        try:
            # Enable birthday coupons
            requests.put(
                f"{API}/settings",
                json={
                    "birthday_coupons_enabled": True,
                    "birthday_discount_percent": 15,
                    "birthday_valid_days": 14,
                },
                headers=headers, timeout=10,
            ).raise_for_status()

            # Trigger sweep
            r = requests.post(f"{API}/settings/run-birthday-sweep", headers=headers, timeout=15)
            assert r.status_code == 200, r.text
            assert r.json()["ok"] is True

            # Look up coupon
            r = requests.get(f"{API}/coupons", headers=headers, timeout=10)
            coupons = r.json()
            bday = [c for c in coupons if c.get("customer_id") == customer_id]
            assert len(bday) == 1, f"Expected exactly 1 birthday coupon, got {len(bday)}"
            coupon = bday[0]
            assert coupon["discount_type"] == "percentage"
            assert coupon["discount_value"] == 15
            assert coupon["customer_id"] == customer_id
            assert coupon["source"] == "birthday"
            assert coupon["code"].startswith("BDAY-")
            assert str(year) in coupon["code"]

            # Idempotency: re-running sweep must NOT create a duplicate
            requests.post(f"{API}/settings/run-birthday-sweep", headers=headers, timeout=15)
            coupons = requests.get(f"{API}/coupons", headers=headers, timeout=10).json()
            bday = [c for c in coupons if c.get("customer_id") == customer_id]
            assert len(bday) == 1, "Sweep must be idempotent (one coupon per customer per year)"
        finally:
            requests.delete(f"{API}/customers/{customer_id}", headers=headers)
            requests.put(
                f"{API}/settings",
                json={"birthday_coupons_enabled": False},
                headers=headers, timeout=10,
            )

    def test_03_sweep_skips_customers_with_other_birthdays(self, headers):
        today_mmdd = datetime.now(timezone.utc).strftime("%m-%d")
        other_mmdd = "01-01" if today_mmdd != "01-01" else "07-04"

        r = requests.post(
            f"{API}/customers",
            json={
                "name": "Other Bday",
                "phone": "876-555-9903",
                "email": "bday_reg_03@test.com",
                "birthday": other_mmdd,
            },
            headers=headers, timeout=10,
        )
        assert r.status_code == 200
        customer_id = r.json()["id"]

        try:
            requests.put(
                f"{API}/settings",
                json={"birthday_coupons_enabled": True},
                headers=headers, timeout=10,
            ).raise_for_status()
            requests.post(f"{API}/settings/run-birthday-sweep", headers=headers, timeout=15)
            coupons = requests.get(f"{API}/coupons", headers=headers, timeout=10).json()
            bday = [c for c in coupons if c.get("customer_id") == customer_id]
            assert len(bday) == 0, "Customer whose birthday is NOT today must not get a coupon"
        finally:
            requests.delete(f"{API}/customers/{customer_id}", headers=headers)
            requests.put(
                f"{API}/settings",
                json={"birthday_coupons_enabled": False},
                headers=headers, timeout=10,
            )

    def test_04_sweep_noop_when_disabled(self, headers):
        today_mmdd = datetime.now(timezone.utc).strftime("%m-%d")

        # Make sure disabled
        requests.put(
            f"{API}/settings",
            json={"birthday_coupons_enabled": False},
            headers=headers, timeout=10,
        )

        r = requests.post(
            f"{API}/customers",
            json={
                "name": "Disabled Sweep",
                "phone": "876-555-9904",
                "email": "bday_reg_04@test.com",
                "birthday": today_mmdd,
            },
            headers=headers, timeout=10,
        )
        customer_id = r.json()["id"]

        try:
            requests.post(f"{API}/settings/run-birthday-sweep", headers=headers, timeout=15)
            coupons = requests.get(f"{API}/coupons", headers=headers, timeout=10).json()
            bday = [c for c in coupons if c.get("customer_id") == customer_id]
            assert len(bday) == 0, "Sweep must no-op when birthday_coupons_enabled is False"
        finally:
            requests.delete(f"{API}/customers/{customer_id}", headers=headers)



class TestUpcomingBirthdaysEndpoint:
    def test_01_returns_customers_in_window_excludes_outside(self, headers):
        from datetime import timedelta
        today = datetime.now(timezone.utc).date()
        mmdd = lambda d: f"{d.month:02d}-{d.day:02d}"  # noqa: E731
        inside = mmdd(today + timedelta(days=3))
        outside = mmdd(today + timedelta(days=20))

        ids = []
        try:
            for name, b in [("Upc Inside", inside), ("Upc Outside", outside)]:
                r = requests.post(
                    f"{API}/customers",
                    json={"name": name, "phone": f"876-555-91{len(ids):02d}", "birthday": b},
                    headers=headers, timeout=10,
                )
                ids.append(r.json()["id"])

            r = requests.get(f"{API}/reports/upcoming-birthdays?days=7", headers=headers, timeout=10)
            assert r.status_code == 200
            data = r.json()
            result_ids = {row["customer_id"] for row in data}
            assert ids[0] in result_ids, "Customer with birthday in window should appear"
            assert ids[1] not in result_ids, "Customer beyond window should NOT appear"
            inside_row = next(r for r in data if r["customer_id"] == ids[0])
            assert inside_row["days_until"] == 3
            assert "coupon_already_sent" in inside_row
        finally:
            for cid in ids:
                requests.delete(f"{API}/customers/{cid}", headers=headers)

    def test_02_days_param_clamped(self, headers):
        # days=0 should clamp to 1 (at least today)
        r = requests.get(f"{API}/reports/upcoming-birthdays?days=0", headers=headers, timeout=10)
        assert r.status_code == 200
        # Should not 500; just returns whatever matches today
