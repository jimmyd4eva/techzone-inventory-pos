"""Tests for auto-email summary reports and personalized coupons (P2 features)."""
import os
import pytest
import httpx
from datetime import datetime, timezone

BACKEND_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BACKEND_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BACKEND_URL = line.strip().split("=", 1)[1]
                break

API = f"{BACKEND_URL}/api"
ADMIN = {"username": "admin", "password": "admin123"}


@pytest.fixture(scope="module")
def admin_token():
    r = httpx.post(f"{API}/auth/login", json=ADMIN, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def customer_id(admin_token):
    r = httpx.get(
        f"{API}/customers",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=15,
    )
    assert r.status_code == 200
    customers = r.json()
    assert len(customers) > 0, "Need at least one customer to run personalized-coupon tests"
    return customers[0]["id"]


# ---------------------------------------------------------------------------
# P2B — Personalized coupons
# ---------------------------------------------------------------------------
class TestPersonalizedCoupons:
    CODE = "E2EPERS_FOR_TESTS"

    def _cleanup(self, token):
        r = httpx.get(f"{API}/coupons", headers={"Authorization": f"Bearer {token}"})
        for c in r.json():
            if c.get("code") == self.CODE:
                httpx.delete(
                    f"{API}/coupons/{c['id']}",
                    headers={"Authorization": f"Bearer {token}"},
                )

    def test_01_create_personalized_coupon_persists_customer(self, admin_token, customer_id):
        self._cleanup(admin_token)
        r = httpx.post(
            f"{API}/coupons",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "code": self.CODE,
                "description": "Test personalized",
                "discount_type": "percentage",
                "discount_value": 15,
                "is_active": True,
                "customer_id": customer_id,
                "customer_name": "Test Cust",
            },
            timeout=15,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["customer_id"] == customer_id
        assert body["customer_name"] == "Test Cust"

    def test_02_validate_rejects_without_customer(self, admin_token):
        r = httpx.post(
            f"{API}/coupons/validate",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"code": self.CODE, "subtotal": 100},
        )
        assert r.status_code == 400
        assert "personalized" in r.json()["detail"].lower()

    def test_03_validate_rejects_wrong_customer(self, admin_token):
        r = httpx.post(
            f"{API}/coupons/validate",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"code": self.CODE, "subtotal": 100, "customer_id": "some-other-id"},
        )
        assert r.status_code == 400
        assert "not valid for this customer" in r.json()["detail"].lower()

    def test_04_validate_accepts_matching_customer(self, admin_token, customer_id):
        r = httpx.post(
            f"{API}/coupons/validate",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"code": self.CODE, "subtotal": 100, "customer_id": customer_id},
        )
        assert r.status_code == 200
        body = r.json()
        assert body["valid"] is True
        assert body["discount"] == 15.0

    def test_05_cleanup(self, admin_token):
        self._cleanup(admin_token)


# ---------------------------------------------------------------------------
# P2A — Auto-email summary reports
# ---------------------------------------------------------------------------
class TestAutoSummaryReports:
    def test_01_period_range_helper(self):
        import sys
        sys.path.insert(0, "/app/backend")
        from routes.reports import _period_range

        now = datetime(2026, 4, 15, 12, 0, 0, tzinfo=timezone.utc)  # Wed
        start, end, label = _period_range("weekly", now=now)
        assert label == "Weekly"
        assert start.weekday() == 0  # Monday
        assert (end - start).days == 7

        start, end, label = _period_range("monthly", now=now)
        assert label == "Monthly"
        assert start.day == 1
        assert end.day == 1
        assert end.month > start.month or end.year > start.year

    def test_02_send_now_requires_recipient(self, admin_token):
        # Ensure no recipient (empty string is truthy-falsy → "not to_email" catches it)
        httpx.put(
            f"{API}/settings",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"shift_report_email": ""},
        )
        r = httpx.post(
            f"{API}/reports/send-summary-now",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"period": "weekly"},
        )
        assert r.status_code == 400
        assert "recipient" in r.json()["detail"].lower()

    def test_03_send_now_weekly(self, admin_token):
        httpx.put(
            f"{API}/settings",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"shift_report_email": "test-auto@example.com"},
        )
        r = httpx.post(
            f"{API}/reports/send-summary-now",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"period": "weekly"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["period"] == "weekly"
        assert body["recipient"] == "test-auto@example.com"
        assert "start" in body["range"]
        assert "end" in body["range"]

    def test_04_send_now_monthly(self, admin_token):
        r = httpx.post(
            f"{API}/reports/send-summary-now",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"period": "monthly"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        assert r.json()["period"] == "monthly"

    def test_05_send_now_invalid_period(self, admin_token):
        r = httpx.post(
            f"{API}/reports/send-summary-now",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"period": "yearly"},
        )
        assert r.status_code == 400

    def test_06_settings_persists_auto_summary_flags(self, admin_token):
        r = httpx.put(
            f"{API}/settings",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"auto_summary_weekly_enabled": True, "auto_summary_monthly_enabled": False},
        )
        assert r.status_code == 200
        body = r.json()
        assert body["auto_summary_weekly_enabled"] is True
        assert body["auto_summary_monthly_enabled"] is False

    def test_07_cleanup(self, admin_token):
        httpx.put(
            f"{API}/settings",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "shift_report_email": "",
                "auto_summary_weekly_enabled": False,
                "auto_summary_monthly_enabled": False,
            },
        )
