"""Backend tests for rich-text business info HTML persistence and PDF generation.

Verifies:
- PUT /api/settings stores HTML in business_name / business_address / business_phone
- GET /api/settings returns the same HTML intact
- Cash register shift close PDF still generates when settings contain HTML
- After restoring TECHZONE plain values, GET still works.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://device-lock-1.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_USER = "admin"
ADMIN_PASS = "admin123"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{API}/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS}, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    return data.get("token") or data.get("access_token")


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def original_settings(auth_headers):
    r = requests.get(f"{API}/settings", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    return r.json()


# ---- Settings HTML persistence ----

class TestSettingsHtmlPersistence:
    def test_put_get_html_business_info(self, auth_headers, original_settings):
        html_name = '<b>TECH</b><span style="font-size:24px">ZONE</span>'
        html_addr = '<i>30 Giltress Street</i><br>Kingston 2, JA'
        html_phone = '<u>(876) 843-2416</u>'
        payload = {
            **{k: v for k, v in original_settings.items() if k not in ("_id", "id")},
            "business_name": html_name,
            "business_address": html_addr,
            "business_phone": html_phone,
        }
        # tax_rate should already be a fraction in GET; PUT expects fraction too
        put = requests.put(f"{API}/settings", headers=auth_headers, json=payload, timeout=30)
        assert put.status_code == 200, put.text

        got = requests.get(f"{API}/settings", headers=auth_headers, timeout=30).json()
        assert got["business_name"] == html_name
        assert got["business_address"] == html_addr
        assert got["business_phone"] == html_phone

    def test_plain_text_still_works(self, auth_headers, original_settings):
        payload = {
            **{k: v for k, v in original_settings.items() if k not in ("_id", "id")},
            "business_name": "TECHZONE",
            "business_address": "30 Giltress Street, Kingston 2, JA",
            "business_phone": "(876) 843-2416 / (876) 633-9251",
        }
        r = requests.put(f"{API}/settings", headers=auth_headers, json=payload, timeout=30)
        assert r.status_code == 200
        got = requests.get(f"{API}/settings", headers=auth_headers, timeout=30).json()
        assert got["business_name"] == "TECHZONE"


# ---- PDF generation with HTML in settings ----

class TestShiftReportPdfWithHtml:
    def _set_html_settings(self, auth_headers, original_settings):
        payload = {
            **{k: v for k, v in original_settings.items() if k not in ("_id", "id")},
            "business_name": '<b>TECH</b><span style="font-size:24px;color:#dc2626">ZONE</span>',
            "business_address": '<i>30 Giltress St</i><br>Kingston 2',
            "business_phone": '<u>(876) 843-2416</u>',
        }
        r = requests.put(f"{API}/settings", headers=auth_headers, json=payload, timeout=30)
        assert r.status_code == 200

    def test_open_then_close_shift_with_html_settings_generates_pdf(self, auth_headers, original_settings):
        self._set_html_settings(auth_headers, original_settings)

        # Ensure no shift currently open; if one exists, close it first
        cur = requests.get(f"{API}/cash-register/current", headers=auth_headers, timeout=30).json()
        if cur.get("shift"):
            requests.post(f"{API}/cash-register/close", headers=auth_headers,
                          json={"closing_amount": cur["totals"].get("expected_amount", 0), "notes": "auto-close"}, timeout=30)

        # Open a shift
        opn = requests.post(f"{API}/cash-register/open", headers=auth_headers,
                            json={"opening_amount": 100.0}, timeout=30)
        assert opn.status_code == 200, opn.text
        shift_id = opn.json()["shift"]["id"]

        # Close a shift
        close = requests.post(f"{API}/cash-register/close", headers=auth_headers,
                              json={"closing_amount": 100.0, "notes": "html-test"}, timeout=30)
        assert close.status_code == 200, close.text

        # Download report
        r = requests.get(f"{API}/cash-register/report/{shift_id}", headers=auth_headers, timeout=60)
        assert r.status_code == 200, r.text
        assert r.content[:4] == b"%PDF", "Response is not a valid PDF"
        assert len(r.content) > 1000


# ---- Restore production values ----

class TestRestoreProductionValues:
    def test_restore_techzone_defaults(self, auth_headers, original_settings):
        payload = {
            **{k: v for k, v in original_settings.items() if k not in ("_id", "id")},
            "business_name": "TECHZONE",
            "business_address": "30 Giltress Street, Kingston 2, JA",
            "business_phone": "(876) 843-2416 / (876) 633-9251",
        }
        r = requests.put(f"{API}/settings", headers=auth_headers, json=payload, timeout=30)
        assert r.status_code == 200
        got = requests.get(f"{API}/settings", headers=auth_headers, timeout=30).json()
        assert got["business_name"] == "TECHZONE"
        assert got["business_address"] == "30 Giltress Street, Kingston 2, JA"
        assert got["business_phone"] == "(876) 843-2416 / (876) 633-9251"
