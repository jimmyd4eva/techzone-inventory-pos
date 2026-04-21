"""All Pydantic models shared across route modules."""
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


# ============ MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    role: str  # admin, technician, cashier
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str

class UserLogin(BaseModel):
    username: str
    password: str

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_number: Optional[str] = None
    name: str
    email: Optional[str] = None
    phone: str
    address: Optional[str] = None
    customer_type: str = "retail"  # retail or wholesale
    # Points system
    total_spent: float = 0  # Total amount spent by customer
    points_balance: float = 0  # Current points balance
    points_earned: float = 0  # Total points ever earned
    points_redeemed: float = 0  # Total points ever redeemed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    account_number: Optional[str] = None
    name: str
    email: Optional[str] = None
    phone: str
    address: Optional[str] = None
    customer_type: str = "retail"  # retail or wholesale

class InventoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # phone, part, accessory, other
    sku: str
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    gsm_arena_url: Optional[str] = None
    quantity: int
    cost_price: float
    selling_price: float  # Retail price
    wholesale_price: Optional[float] = None  # Wholesale price (if different)
    supplier: Optional[str] = None
    low_stock_threshold: int = 10
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InventoryItemCreate(BaseModel):
    name: str
    type: str
    sku: str
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    gsm_arena_url: Optional[str] = None
    quantity: int
    cost_price: float
    selling_price: float
    wholesale_price: Optional[float] = None
    supplier: Optional[str] = None
    low_stock_threshold: int = 10

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    gsm_arena_url: Optional[str] = None
    quantity: Optional[int] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    wholesale_price: Optional[float] = None
    supplier: Optional[str] = None
    low_stock_threshold: Optional[int] = None

class RepairJob(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    customer_name: str
    device: str
    issue_description: str
    status: str  # pending, in-progress, completed, delivered
    assigned_technician: Optional[str] = None
    cost: float
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RepairJobCreate(BaseModel):
    customer_id: str
    device: str
    issue_description: str
    cost: float
    assigned_technician: Optional[str] = None
    notes: Optional[str] = None

class RepairJobUpdate(BaseModel):
    device: Optional[str] = None
    issue_description: Optional[str] = None
    status: Optional[str] = None
    assigned_technician: Optional[str] = None
    cost: Optional[float] = None
    notes: Optional[str] = None

class SaleItem(BaseModel):
    item_id: str
    item_name: str
    quantity: int
    price: float
    subtotal: float

class Sale(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    items: List[SaleItem]
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    payment_method: str  # cash, stripe, paypal
    subtotal: float
    tax: float
    discount: float = 0  # Coupon discount amount
    coupon_code: Optional[str] = None
    coupon_id: Optional[str] = None
    points_used: float = 0  # Points redeemed for this sale
    points_discount: float = 0  # Discount from points
    points_earned: float = 0  # Points earned from this sale
    total: float
    payment_status: str  # completed, pending
    stripe_session_id: Optional[str] = None
    paypal_order_id: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SaleCreate(BaseModel):
    items: List[SaleItem]
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    payment_method: str
    coupon_code: Optional[str] = None
    points_to_use: float = 0  # Points customer wants to redeem
    created_by: str

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    sale_id: str
    amount: float
    currency: str
    payment_status: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CheckoutRequest(BaseModel):
    sale_id: str
    origin_url: str

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "app_settings"
    tax_rate: float = 0.0  # Tax rate as decimal (e.g., 0.1 for 10%)
    tax_enabled: bool = False
    currency: str = "USD"
    # Category-specific tax exemptions (categories listed here are TAX EXEMPT)
    tax_exempt_categories: List[str] = []
    # Business info
    business_name: str = "TECHZONE"
    business_address: str = "30 Giltress Street, Kingston 2, JA"
    business_phone: str = "876-633-9251 / 876-843-2416"
    business_logo: Optional[str] = None
    # Points system
    points_enabled: bool = False
    points_per_dollar: float = 0.002  # 1 point per $500 = 0.002 points per $1
    points_redemption_threshold: float = 3500  # Min spend to redeem points
    points_value: float = 1  # Each point worth $1 in discount
    # Dual pricing settings
    dual_pricing_enabled: bool = False
    cash_discount_percent: float = 0  # Discount percentage for cash payments
    card_surcharge_percent: float = 0  # Surcharge percentage for card payments
    # Cash Register settings
    shift_report_email_enabled: bool = False  # Auto-email shift reports when closed
    shift_report_email: Optional[str] = None  # Manager email for shift reports
    # Auto-email tax & sales summaries
    auto_summary_weekly_enabled: bool = False
    auto_summary_monthly_enabled: bool = False
    auto_summary_last_weekly_sent: Optional[str] = None  # ISO timestamp
    auto_summary_last_monthly_sent: Optional[str] = None  # ISO timestamp
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: Optional[str] = None

class SettingsUpdate(BaseModel):
    tax_rate: Optional[float] = None
    tax_enabled: Optional[bool] = None
    currency: Optional[str] = None
    tax_exempt_categories: Optional[List[str]] = None
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    business_phone: Optional[str] = None
    business_logo: Optional[str] = None
    points_enabled: Optional[bool] = None
    points_per_dollar: Optional[float] = None
    points_redemption_threshold: Optional[float] = None
    points_value: Optional[float] = None
    dual_pricing_enabled: Optional[bool] = None
    cash_discount_percent: Optional[float] = None
    card_surcharge_percent: Optional[float] = None
    points_redemption_threshold: Optional[float] = None
    points_value: Optional[float] = None
    shift_report_email_enabled: Optional[bool] = None
    shift_report_email: Optional[str] = None
    auto_summary_weekly_enabled: Optional[bool] = None
    auto_summary_monthly_enabled: Optional[bool] = None

# ============ COUPON MODELS ============

class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str  # Unique coupon code
    description: Optional[str] = None
    discount_type: str  # 'percentage' or 'fixed'
    discount_value: float  # Percentage (0-100) or fixed amount
    min_purchase: float = 0  # Minimum purchase amount to use coupon
    max_discount: Optional[float] = None  # Maximum discount for percentage coupons
    usage_limit: Optional[int] = None  # Max number of times coupon can be used
    usage_count: int = 0  # How many times it's been used
    is_active: bool = True
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    # Personalized coupon: if set, only this customer can use it
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None

class CouponCreate(BaseModel):
    code: str
    description: Optional[str] = None
    discount_type: str
    discount_value: float
    min_purchase: float = 0
    max_discount: Optional[float] = None
    usage_limit: Optional[int] = None
    is_active: bool = True
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None

class CouponUpdate(BaseModel):
    code: Optional[str] = None
    description: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_purchase: Optional[float] = None
    max_discount: Optional[float] = None
    usage_limit: Optional[int] = None
    is_active: Optional[bool] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None

# ============ ACTIVATION MODELS ============

class ActivationCode(BaseModel):
    """Activation code for device licensing"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str  # 6-digit activation code
    email: str  # Email this code was sent to
    device_id: Optional[str] = None  # Device ID this code is for
    is_used: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=12))

class ActivatedDevice(BaseModel):
    """Record of an activated device"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str  # Unique device identifier (generated from hardware/browser fingerprint)
    activation_code: str  # The code used to activate
    activated_email: str  # Email address that activated this device
    activated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ActivationRequest(BaseModel):
    """Request to generate activation code"""
    email: str

class ActivationVerify(BaseModel):
    """Request to verify activation code"""
    code: str
    device_id: str

class ActivationCheckRequest(BaseModel):
    """Request to check if device is activated"""
    device_id: str

# ============ CASH REGISTER MODELS ============

class CashRegisterShift(BaseModel):
    """A cash register shift (open/close)"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    opened_by: str  # User ID who opened the shift
    opened_by_name: str  # Username for display
    opening_amount: float  # Starting cash float
    closing_amount: Optional[float] = None  # Actual cash counted at close
    expected_amount: Optional[float] = None  # Calculated expected cash
    difference: Optional[float] = None  # closing - expected (over/short)
    status: str = "open"  # open, closed
    notes: Optional[str] = None
    opened_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    closed_at: Optional[datetime] = None
    closed_by: Optional[str] = None
    closed_by_name: Optional[str] = None

class CashRegisterTransaction(BaseModel):
    """Individual cash register transaction (sale, payout, drop)"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shift_id: str  # Links to CashRegisterShift
    transaction_type: str  # cash_sale, payout, drop, refund
    amount: float  # Positive for cash in, negative for cash out
    description: Optional[str] = None
    sale_id: Optional[str] = None  # Reference to sale if applicable
    created_by: str  # User ID
    created_by_name: str  # Username for display
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OpenShiftRequest(BaseModel):
    opening_amount: float

class CloseShiftRequest(BaseModel):
    closing_amount: float
    notes: Optional[str] = None

class CashTransactionRequest(BaseModel):
    transaction_type: str  # payout, drop, refund
    amount: float
    description: Optional[str] = None


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None

