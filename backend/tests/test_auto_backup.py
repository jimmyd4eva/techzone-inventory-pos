"""Regression tests for the auto-backup scheduling helpers.

Pinning `_is_due` here prevents regressions around the "never sent" / corrupt
timestamp edge cases flagged in the Feb 2026 code review.
"""
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.auto_backup_service import _is_due, _parse_iso  # noqa: E402


def _ago(days: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()


def test_never_sent_is_always_due():
    assert _is_due(None, "weekly") is True
    assert _is_due("", "weekly") is True


def test_corrupt_timestamp_treated_as_never_sent():
    assert _is_due("not-a-date", "weekly") is True
    assert _is_due("", "monthly") is True


def test_weekly_interval_respected():
    assert _is_due(_ago(6), "weekly") is False
    assert _is_due(_ago(8), "weekly") is True


def test_monthly_interval_respected():
    assert _is_due(_ago(8), "monthly") is False
    assert _is_due(_ago(31), "monthly") is True


def test_parse_iso_boundary_cases():
    assert _parse_iso(None) is None
    assert _parse_iso("") is None
    assert _parse_iso("bogus") is None
    parsed = _parse_iso(datetime.now(timezone.utc).isoformat())
    assert parsed is not None and parsed.tzinfo is not None
