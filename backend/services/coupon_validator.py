"""
CouponValidator — encapsulates the rules a coupon must pass at checkout.

Extracted from `routes/coupons.py::validate_coupon()` (which previously had
cyclomatic complexity 16 with all rules inlined). Each rule is now a small,
independently testable function. The route handler just orchestrates them
and translates ValidationError into HTTPException.
"""
from datetime import datetime, timezone
from typing import Optional, Tuple


class CouponValidationError(Exception):
    """Raised by a single validator. Message is safe to surface to end users."""

    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _check_active(coupon: dict) -> None:
    if not coupon.get("is_active", False):
        raise CouponValidationError("This coupon is no longer active")


def _check_customer_lock(coupon: dict, customer_id: Optional[str]) -> None:
    """Personalized coupons must be redeemed by their assigned customer."""
    locked_to = coupon.get("customer_id")
    if not locked_to:
        return
    if not customer_id:
        raise CouponValidationError(
            "This coupon is personalized and requires a customer at checkout"
        )
    if customer_id != locked_to:
        raise CouponValidationError("This coupon is not valid for this customer")


def _check_usage_limit(coupon: dict) -> None:
    limit = coupon.get("usage_limit")
    if limit and coupon.get("usage_count", 0) >= limit:
        raise CouponValidationError("This coupon has reached its usage limit")


def _check_min_purchase(coupon: dict, subtotal: float) -> None:
    minimum = coupon.get("min_purchase", 0) or 0
    if subtotal < minimum:
        raise CouponValidationError(
            f"Minimum purchase of ${minimum:.2f} required"
        )


def _check_date_range(coupon: dict, now_iso: Optional[str] = None) -> None:
    if now_iso is None:
        now_iso = datetime.now(timezone.utc).isoformat()
    valid_from = coupon.get("valid_from")
    valid_until = coupon.get("valid_until")
    if valid_from and now_iso < valid_from:
        raise CouponValidationError("This coupon is not yet valid")
    if valid_until and now_iso > valid_until:
        raise CouponValidationError("This coupon has expired")


def _calculate_discount(coupon: dict, subtotal: float) -> float:
    """Return rounded discount amount for a passing coupon."""
    if coupon.get("discount_type") == "percentage":
        amount = subtotal * (coupon.get("discount_value", 0) / 100)
        cap = coupon.get("max_discount")
        if cap and amount > cap:
            amount = cap
    else:  # fixed-amount
        amount = min(coupon.get("discount_value", 0), subtotal)
    return round(amount, 2)


def validate_and_calculate(
    coupon: dict, subtotal: float, customer_id: Optional[str]
) -> Tuple[dict, float]:
    """Run every rule, then return (coupon, discount).

    Raises `CouponValidationError` on the first failure so the route can
    map it to an HTTP 400 with a user-safe message.
    """
    _check_active(coupon)
    _check_customer_lock(coupon, customer_id)
    _check_usage_limit(coupon)
    _check_min_purchase(coupon, subtotal)
    _check_date_range(coupon)
    return coupon, _calculate_discount(coupon, subtotal)
