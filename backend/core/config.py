"""Central configuration: env vars, MongoDB client, integration flags."""
import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent.parent
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
load_dotenv(ROOT_DIR / '.env')

# Email configuration
EMAIL_ADDRESS = os.environ.get('EMAIL_ADDRESS', '')
EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD', '')
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', '') or 'dev-only-secret-key-replace-in-production'
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Stripe configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# PayPal configuration
PAYPAL_CLIENT_ID = os.environ.get('PAYPAL_CLIENT_ID', 'test')
PAYPAL_SECRET = os.environ.get('PAYPAL_SECRET', 'test')
PAYPAL_MODE = os.environ.get('PAYPAL_MODE', 'sandbox')

# Optional integrations
try:
    from emergentintegrations.payments.stripe.checkout import (
        StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
    )
    STRIPE_AVAILABLE = True
except ImportError:
    STRIPE_AVAILABLE = False
    StripeCheckout = None
    CheckoutSessionResponse = None
    CheckoutStatusResponse = None
    CheckoutSessionRequest = None

try:
    from paypalcheckoutsdk.core import PayPalHttpClient, SandboxEnvironment, LiveEnvironment
    from paypalcheckoutsdk.orders import OrdersCreateRequest, OrdersCaptureRequest, OrdersGetRequest
    PAYPAL_AVAILABLE = True
except ImportError:
    PAYPAL_AVAILABLE = False
    PayPalHttpClient = None
    SandboxEnvironment = None
    LiveEnvironment = None
    OrdersCreateRequest = None
    OrdersCaptureRequest = None
    OrdersGetRequest = None

# Initialize PayPal client (only if available)
paypal_client = None
if PAYPAL_AVAILABLE and PayPalHttpClient:
    try:
        if PAYPAL_MODE == 'live':
            paypal_environment = LiveEnvironment(client_id=PAYPAL_CLIENT_ID, client_secret=PAYPAL_SECRET)
        else:
            paypal_environment = SandboxEnvironment(client_id=PAYPAL_CLIENT_ID, client_secret=PAYPAL_SECRET)
        paypal_client = PayPalHttpClient(paypal_environment)
    except Exception as e:
        print(f"PayPal initialization skipped: {e}")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('techzone')
