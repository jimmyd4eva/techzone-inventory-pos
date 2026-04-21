"""Regression sweep after server.py split into core/routes/services/models.
Covers all domains mentioned in review_request. Endpoints must live at
identical /api/... paths.
"""
import io
import os
import uuid
import pytest
import requests

BASE_URL = (os.environ.get('REACT_APP_BACKEND_URL')
            or 'https://device-lock-1.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"
ADMIN = {"username": "admin", "password": "admin123"}


# ---------- Fixtures ----------
@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{API}/auth/login", json=ADMIN, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def H(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def original_settings(H):
    r = requests.get(f"{API}/settings", headers=H, timeout=30)
    assert r.status_code == 200
    return r.json()


# ---------- 1. Auth ----------
class TestAuth:
    def test_login_returns_token(self):
        r = requests.post(f"{API}/auth/login", json=ADMIN, timeout=30)
        assert r.status_code == 200
        j = r.json()
        assert isinstance(j.get("token"), str) and len(j["token"]) > 20
        assert j["user"]["username"] == "admin"
        assert j["user"]["role"] == "admin"

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login",
                          json={"username": "admin", "password": "wrong"}, timeout=30)
        assert r.status_code == 401

    def test_me_with_bearer(self, H):
        r = requests.get(f"{API}/auth/me", headers=H, timeout=30)
        assert r.status_code == 200
        assert r.json()["username"] == "admin"

    def test_me_without_bearer_rejected(self):
        r = requests.get(f"{API}/auth/me", timeout=30)
        assert r.status_code in (401, 403)


# ---------- 2. Customers CRUD ----------
class TestCustomers:
    def test_crud_cycle(self, H):
        acct = f"T{uuid.uuid4().hex[:6]}"
        payload = {"name": "TEST_Cust", "phone": f"8761234{uuid.uuid4().hex[:4]}",
                   "email": "tc@test.com", "account_number": acct}
        r = requests.post(f"{API}/customers", headers=H, json=payload, timeout=30)
        assert r.status_code == 200, r.text
        cid = r.json()["id"]

        g = requests.get(f"{API}/customers/{cid}", headers=H, timeout=30)
        assert g.status_code == 200
        assert g.json()["account_number"] == acct

        lst = requests.get(f"{API}/customers", headers=H, timeout=30)
        assert lst.status_code == 200 and any(c["id"] == cid for c in lst.json())

        d = requests.delete(f"{API}/customers/{cid}", headers=H, timeout=30)
        assert d.status_code == 200

        g2 = requests.get(f"{API}/customers/{cid}", headers=H, timeout=30)
        assert g2.status_code == 404


# ---------- 3. Inventory ----------
class TestInventory:
    def test_crud_cycle(self, H):
        p = {"name": "TEST_Item", "type": "accessory", "sku": f"SKU{uuid.uuid4().hex[:6]}",
             "cost_price": 5.0, "selling_price": 10.0, "quantity": 3,
             "low_stock_threshold": 1, "barcode": f"BC{uuid.uuid4().hex[:8]}"}
        r = requests.post(f"{API}/inventory", headers=H, json=p, timeout=30)
        assert r.status_code == 200, r.text
        iid = r.json()["id"]

        u = requests.put(f"{API}/inventory/{iid}", headers=H,
                         json={"selling_price": 15.5}, timeout=30)
        assert u.status_code == 200

        g = requests.get(f"{API}/inventory/{iid}", headers=H, timeout=30)
        assert g.status_code == 200 and g.json()["selling_price"] == 15.5

        low = requests.get(f"{API}/inventory/low-stock", headers=H, timeout=30)
        assert low.status_code == 200 and isinstance(low.json(), list)

        d = requests.delete(f"{API}/inventory/{iid}", headers=H, timeout=30)
        assert d.status_code == 200


# ---------- 4. Repairs ----------
class TestRepairs:
    def test_list_and_create(self, H):
        lst = requests.get(f"{API}/repairs", headers=H, timeout=30)
        assert lst.status_code == 200 and isinstance(lst.json(), list)

        # need a customer first
        cust = requests.post(f"{API}/customers", headers=H,
                             json={"name": "TEST_R", "phone": f"87600{uuid.uuid4().hex[:5]}",
                                   "email": "r@t.com"}, timeout=30).json()
        p = {"customer_id": cust["id"], "device": "Samsung S20",
             "issue_description": "Screen", "cost": 5000}
        r = requests.post(f"{API}/repairs", headers=H, json=p, timeout=30)
        assert r.status_code == 200, r.text
        rid = r.json()["id"]
        requests.delete(f"{API}/repairs/{rid}", headers=H, timeout=30)
        requests.delete(f"{API}/customers/{cust['id']}", headers=H, timeout=30)


# ---------- 5. Coupons ----------
class TestCoupons:
    def test_list_and_create_and_delete(self, H):
        lst = requests.get(f"{API}/coupons", headers=H, timeout=30)
        assert lst.status_code == 200

        code = f"TEST{uuid.uuid4().hex[:6].upper()}"
        p = {"code": code, "description": "t", "discount_type": "percentage",
             "discount_value": 5, "min_purchase": 0}
        c = requests.post(f"{API}/coupons", headers=H, json=p, timeout=30)
        assert c.status_code == 200, c.text
        cid = c.json()["id"]

        d = requests.delete(f"{API}/coupons/{cid}", headers=H, timeout=30)
        assert d.status_code == 200


# ---------- 6. Sales ----------
class TestSales:
    def test_list(self, H):
        r = requests.get(f"{API}/sales", headers=H, timeout=30)
        assert r.status_code == 200 and isinstance(r.json(), list)


# ---------- 7. Users ----------
class TestUsers:
    def test_list_users_admin(self, H):
        r = requests.get(f"{API}/users", headers=H, timeout=30)
        assert r.status_code == 200 and any(u["username"] == "admin" for u in r.json())


# ---------- 8. Settings ----------
class TestSettings:
    def test_get_settings(self, H):
        r = requests.get(f"{API}/settings", headers=H, timeout=30)
        assert r.status_code == 200
        j = r.json()
        assert "business_name" in j

    def test_put_html_persistence(self, H, original_settings):
        html = '<b>TECH</b><span style="color:#dc2626">ZONE</span>'
        payload = {**{k: v for k, v in original_settings.items() if k not in ("_id", "id")},
                   "business_name": html}
        r = requests.put(f"{API}/settings", headers=H, json=payload, timeout=30)
        assert r.status_code == 200
        g = requests.get(f"{API}/settings", headers=H, timeout=30).json()
        assert g["business_name"] == html


# ---------- 9. Activation ----------
class TestActivation:
    def test_check_public_no_auth(self):
        r = requests.post(f"{API}/activation/check",
                          json={"device_id": "TEST-DEVICE"}, timeout=30)
        assert r.status_code == 200
        assert r.json()["is_activated"] is True

    def test_check_unknown_device(self):
        r = requests.post(f"{API}/activation/check",
                          json={"device_id": f"NONE-{uuid.uuid4().hex}"}, timeout=30)
        assert r.status_code == 200 and r.json()["is_activated"] is False

    def test_request_code_public(self):
        r = requests.post(f"{API}/activation/request-code",
                          json={"email": f"test_{uuid.uuid4().hex[:6]}@test.com"},
                          timeout=30)
        assert r.status_code == 200 and r.json()["success"] is True

    def test_list_admin(self, H):
        r = requests.get(f"{API}/activation/list", headers=H, timeout=30)
        assert r.status_code == 200 and isinstance(r.json(), list)

    def test_revoke_admin_404_for_unknown(self, H):
        r = requests.delete(f"{API}/activation/revoke/NON-EXIST-XYZ",
                            headers=H, timeout=30)
        assert r.status_code == 404


# ---------- 10. Cash register full flow ----------
class TestCashRegister:
    def test_full_flow_and_pdf(self, H):
        # Close any open shift
        cur = requests.get(f"{API}/cash-register/current", headers=H, timeout=30).json()
        if cur.get("shift"):
            requests.post(f"{API}/cash-register/close", headers=H,
                          json={"closing_amount": cur["totals"].get("expected_amount", 0),
                                "notes": "auto"}, timeout=30)

        o = requests.post(f"{API}/cash-register/open", headers=H,
                          json={"opening_amount": 100.0}, timeout=30)
        assert o.status_code == 200, o.text
        shift_id = o.json()["shift"]["id"]

        t = requests.post(f"{API}/cash-register/transaction", headers=H,
                          json={"transaction_type": "drop", "amount": 50.0,
                                "description": "TEST deposit"}, timeout=30)
        assert t.status_code == 200, t.text

        hist = requests.get(f"{API}/cash-register/history", headers=H, timeout=30)
        assert hist.status_code == 200 and isinstance(hist.json(), list)

        c = requests.post(f"{API}/cash-register/close", headers=H,
                          json={"closing_amount": 150.0, "notes": "TEST close"},
                          timeout=30)
        assert c.status_code == 200, c.text

        pdf = requests.get(f"{API}/cash-register/report/{shift_id}",
                           headers=H, timeout=60)
        assert pdf.status_code == 200
        assert pdf.content[:4] == b"%PDF"
        assert len(pdf.content) > 1000


# ---------- 11. Reports ----------
class TestReports:
    def test_dashboard_stats(self, H):
        r = requests.get(f"{API}/reports/dashboard-stats", headers=H, timeout=30)
        assert r.status_code == 200

    def test_daily_sales(self, H):
        r = requests.get(f"{API}/reports/daily-sales", headers=H, timeout=30)
        assert r.status_code == 200

    def test_coupon_analytics(self, H):
        r = requests.get(f"{API}/reports/coupon-analytics", headers=H, timeout=30)
        assert r.status_code == 200

    def test_tax_summary(self, H):
        r = requests.get(f"{API}/reports/tax-summary", headers=H, timeout=30)
        assert r.status_code == 200

    def test_tax_summary_pdf(self, H):
        r = requests.get(f"{API}/reports/tax-summary/pdf", headers=H, timeout=60)
        assert r.status_code == 200
        assert r.content[:4] == b"%PDF"


# ---------- 12. Logo upload ----------
class TestLogoUpload:
    PNG_1x1 = bytes.fromhex(
        "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
        "0000000d49444154789c63f8ffff3f00050001014a2cdf5d0000000049454e44ae426082"
    )

    def test_upload_and_serve(self, token):
        files = {"file": ("tst.png", io.BytesIO(self.PNG_1x1), "image/png")}
        r = requests.post(f"{API}/upload/logo",
                          headers={"Authorization": f"Bearer {token}"},
                          files=files, timeout=30)
        assert r.status_code == 200, r.text
        logo_url = r.json()["logo_url"]
        assert logo_url.startswith("/api/uploads/")
        g = requests.get(f"{BASE_URL}{logo_url}", timeout=30)
        assert g.status_code == 200
        assert g.headers.get("content-type", "").startswith("image/")


# ---------- 13. Restore production values (run last) ----------
class TestZZRestore:
    def test_restore_defaults(self, H, original_settings):
        payload = {**{k: v for k, v in original_settings.items() if k not in ("_id", "id")},
                   "business_name": "TECHZONE",
                   "business_address": "30 Giltress Street, Kingston 2, JA",
                   "business_phone": "(876) 843-2416 / (876) 633-9251"}
        r = requests.put(f"{API}/settings", headers=H, json=payload, timeout=30)
        assert r.status_code == 200
        g = requests.get(f"{API}/settings", headers=H, timeout=30).json()
        assert g["business_name"] == "TECHZONE"
