"""Unit tests for the extracted CouponValidator. These guard the rules
that previously lived inline in routes/coupons.py::validate_coupon().
"""
from datetime import datetime, timezone, timedelta

import pytest

from services.coupon_validator import (
    CouponValidationError,
    validate_and_calculate,
    _calculate_discount,
)


def _coupon(**overrides):
    base = {
        "code": "SAVE10",
        "is_active": True,
        "discount_type": "percentage",
        "discount_value": 10,
        "min_purchase": 0,
        "usage_count": 0,
        "usage_limit": None,
        "max_discount": None,
        "valid_from": None,
        "valid_until": None,
        "customer_id": None,
    }
    base.update(overrides)
    return base


def test_inactive_coupon_rejected():
    with pytest.raises(CouponValidationError, match="no longer active"):
        validate_and_calculate(_coupon(is_active=False), 100, None)


def test_personalized_requires_customer():
    with pytest.raises(CouponValidationError, match="requires a customer"):
        validate_and_calculate(_coupon(customer_id="cust-1"), 100, None)


def test_personalized_wrong_customer_rejected():
    with pytest.raises(CouponValidationError, match="not valid for this customer"):
        validate_and_calculate(_coupon(customer_id="cust-1"), 100, "cust-2")


def test_personalized_correct_customer_accepted():
    _, discount = validate_and_calculate(
        _coupon(customer_id="cust-1"), 100, "cust-1"
    )
    assert discount == 10.0


def test_usage_limit_exhausted():
    with pytest.raises(CouponValidationError, match="usage limit"):
        validate_and_calculate(
            _coupon(usage_limit=5, usage_count=5), 100, None
        )


def test_min_purchase_enforced():
    with pytest.raises(CouponValidationError, match="Minimum purchase"):
        validate_and_calculate(_coupon(min_purchase=200), 100, None)


def test_valid_from_future_rejected():
    future = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    with pytest.raises(CouponValidationError, match="not yet valid"):
        validate_and_calculate(_coupon(valid_from=future), 100, None)


def test_valid_until_past_rejected():
    past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    with pytest.raises(CouponValidationError, match="expired"):
        validate_and_calculate(_coupon(valid_until=past), 100, None)


def test_percentage_discount_capped_by_max():
    coupon = _coupon(discount_type="percentage", discount_value=50, max_discount=20)
    assert _calculate_discount(coupon, 100) == 20.0


def test_percentage_discount_uncapped():
    coupon = _coupon(discount_type="percentage", discount_value=15)
    assert _calculate_discount(coupon, 200) == 30.0


def test_fixed_discount_clipped_to_subtotal():
    coupon = _coupon(discount_type="fixed", discount_value=50)
    assert _calculate_discount(coupon, 30) == 30.0


def test_fixed_discount_normal():
    coupon = _coupon(discount_type="fixed", discount_value=15)
    assert _calculate_discount(coupon, 100) == 15.0


def test_full_pipeline_returns_coupon_and_discount():
    coupon = _coupon(discount_type="percentage", discount_value=20)
    out_coupon, discount = validate_and_calculate(coupon, 50, None)
    assert out_coupon is coupon
    assert discount == 10.0
