import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ProductSelection } from '../components/sales/ProductSelection';
import { OpenRegisterModal } from '../components/sales/OpenRegisterModal';
import { CartItems } from '../components/sales/CartItems';
import { CartSummary } from '../components/sales/CartSummary';
import { CouponPanel } from '../components/sales/CouponPanel';
import { PointsPanel } from '../components/sales/PointsPanel';
import { CustomerLookup } from '../components/sales/CustomerLookup';
import { CheckoutPanel } from '../components/sales/CheckoutPanel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Sales = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerAccountNumber, setCustomerAccountNumber] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [taxSettings, setTaxSettings] = useState({ 
    tax_rate: 0, 
    tax_enabled: false,
    tax_exempt_categories: []
  });
  const [pointsSettings, setPointsSettings] = useState({
    points_enabled: false,
    points_per_dollar: 0.002,
    points_redemption_threshold: 3500,
    points_value: 1
  });
  const [dualPricingSettings, setDualPricingSettings] = useState({
    dual_pricing_enabled: false,
    cash_discount_percent: 0,
    card_surcharge_percent: 0
  });
  const [pointsToUse, setPointsToUse] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showCouponList, setShowCouponList] = useState(false);
  // Cash Register State
  const [currentShift, setCurrentShift] = useState(null);
  const [showOpenRegisterModal, setShowOpenRegisterModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchInventory();
    fetchTaxSettings();
    fetchAvailableCoupons();
    fetchCurrentShift();
  }, []);

  const fetchCurrentShift = async () => {
    try {
      const response = await axios.get(`${API}/cash-register/current`);
      setCurrentShift(response.data.shift);
    } catch (error) {
      console.error('Error fetching current shift:', error);
    }
  };

  const handleOpenRegister = async () => {
    if (!openingAmount || parseFloat(openingAmount) < 0) {
      setRegisterMessage('Please enter a valid opening amount');
      return;
    }
    try {
      await axios.post(`${API}/cash-register/open`, 
        { opening_amount: parseFloat(openingAmount) }
      );
      setShowOpenRegisterModal(false);
      setOpeningAmount('');
      setRegisterMessage('');
      fetchCurrentShift();
    } catch (error) {
      setRegisterMessage(error.response?.data?.detail || 'Failed to open register');
    }
  };

  const fetchAvailableCoupons = async () => {
    try {
      const response = await axios.get(`${API}/coupons`);
      // Filter only active coupons that haven't exceeded usage limit
      const active = response.data.filter(c => 
        c.is_active && 
        (!c.usage_limit || c.usage_count < c.usage_limit)
      );
      setAvailableCoupons(active);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  const fetchTaxSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setTaxSettings({
        tax_rate: response.data.tax_rate || 0,
        tax_enabled: response.data.tax_enabled || false,
        tax_exempt_categories: response.data.tax_exempt_categories || []
      });
      setPointsSettings({
        points_enabled: response.data.points_enabled || false,
        points_per_dollar: response.data.points_per_dollar || 0.002,
        points_redemption_threshold: response.data.points_redemption_threshold || 3500,
        points_value: response.data.points_value || 1
      });
      setDualPricingSettings({
        dual_pricing_enabled: response.data.dual_pricing_enabled || false,
        cash_discount_percent: response.data.cash_discount_percent || 0,
        card_surcharge_percent: response.data.card_surcharge_percent || 0
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const applyCoupon = async (code = null) => {
    const codeToApply = code || couponCode;
    if (!codeToApply.trim()) return;
    setCouponError('');
    setShowCouponList(false);
    
    try {
      const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
      const response = await axios.post(`${API}/coupons/validate`, {
        code: codeToApply,
        subtotal: subtotal,
        customer_id: selectedCustomer ? selectedCustomer.id : undefined
      });
      
      setAppliedCoupon(response.data.coupon);
      setCouponDiscount(response.data.discount);
      setCouponCode('');
    } catch (error) {
      setCouponError(error.response?.data?.detail || 'Invalid coupon');
      setAppliedCoupon(null);
      setCouponDiscount(0);
    }
  };

  const selectCoupon = (coupon) => {
    applyCoupon(coupon.code);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponError('');
  };

  // Recalculate coupon discount when cart changes
  useEffect(() => {
    if (appliedCoupon && cart.length > 0) {
      const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
      if (subtotal < (appliedCoupon.min_purchase || 0)) {
        removeCoupon();
      } else {
        // Recalculate discount
        let discount;
        if (appliedCoupon.discount_type === 'percentage') {
          discount = subtotal * (appliedCoupon.discount_value / 100);
          if (appliedCoupon.max_discount && discount > appliedCoupon.max_discount) {
            discount = appliedCoupon.max_discount;
          }
        } else {
          discount = Math.min(appliedCoupon.discount_value, subtotal);
        }
        setCouponDiscount(discount);
      }
    } else if (cart.length === 0) {
      removeCoupon();
    }
  }, [cart, appliedCoupon]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const filtered = inventory.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredInventory(filtered);
  }, [searchTerm, inventory]);

  const fetchInventory = async () => {
    try {
      const response = await axios.get(`${API}/inventory`);
      const inStockItems = response.data.filter(item => item.quantity > 0);
      setInventory(inStockItems);
      setFilteredInventory(inStockItems);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchCustomerByAccount = async (accountNum) => {
    if (!accountNum || accountNum.length < 2) {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/customers`);
      
      const searchLower = accountNum.toLowerCase();
      const filtered = response.data.filter(customer =>
        (customer.account_number && customer.account_number.toLowerCase().includes(searchLower)) ||
        (customer.name && customer.name.toLowerCase().includes(searchLower)) ||
        (customer.phone && customer.phone.includes(accountNum))
      );
      
      setCustomerSearchResults(filtered);
      setShowCustomerDropdown(filtered.length > 0);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
    }
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerAccountNumber(customer.account_number);
    setCustomerName(customer.name);
    setShowCustomerDropdown(false);
    setPointsToUse(0); // Reset points when selecting new customer
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerAccountNumber('');
    setCustomerName('');
    setCustomerSearchResults([]);
    setShowCustomerDropdown(false);
    setPointsToUse(0); // Reset points when clearing customer
  };

  // Get the appropriate price based on customer type
  const getItemPrice = (item) => {
    if (selectedCustomer?.customer_type === 'wholesale' && item.wholesale_price) {
      return item.wholesale_price;
    }
    return item.selling_price;
  };

  const addToCart = (item) => {
    const existingItem = cart.find(i => i.item_id === item.id);
    const price = getItemPrice(item);
    
    if (existingItem) {
      if (existingItem.quantity < item.quantity) {
        setCart(cart.map(i =>
          i.item_id === item.id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
            : i
        ));
      }
    } else {
      setCart([...cart, {
        item_id: item.id,
        item_name: item.name,
        quantity: 1,
        price: price,
        retail_price: item.selling_price,
        wholesale_price: item.wholesale_price,
        subtotal: price,
        image_url: item.image_url,
        gsm_arena_url: item.gsm_arena_url
      }]);
    }
  };

  // Update cart prices when customer changes
  useEffect(() => {
    if (cart.length > 0) {
      setCart(cart.map(cartItem => {
        const invItem = inventory.find(i => i.id === cartItem.item_id);
        if (invItem) {
          const newPrice = selectedCustomer?.customer_type === 'wholesale' && invItem.wholesale_price 
            ? invItem.wholesale_price 
            : invItem.selling_price;
          return {
            ...cartItem,
            price: newPrice,
            subtotal: cartItem.quantity * newPrice
          };
        }
        return cartItem;
      }));
    }
  }, [selectedCustomer?.customer_type]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateQuantity = (itemId, change) => {
    const item = cart.find(i => i.item_id === itemId);
    const inventoryItem = inventory.find(i => i.id === itemId);
    
    if (change > 0 && item.quantity >= inventoryItem.quantity) return;
    
    if (item.quantity + change <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(i =>
        i.item_id === itemId
          ? { ...i, quantity: i.quantity + change, subtotal: (i.quantity + change) * i.price }
          : i
      ));
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(i => i.item_id !== itemId));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    
    // Calculate taxable amount (exclude exempt categories)
    let taxableSubtotal = 0;
    cart.forEach(cartItem => {
      // Find the inventory item to get its type
      const invItem = inventory.find(i => i.id === cartItem.item_id);
      const itemType = invItem?.type?.toLowerCase() || '';
      const exemptCategories = taxSettings.tax_exempt_categories.map(c => c.toLowerCase());
      
      // Add to taxable if not in exempt list
      if (!exemptCategories.includes(itemType)) {
        taxableSubtotal += cartItem.subtotal;
      }
    });
    
    const tax = taxSettings.tax_enabled ? taxableSubtotal * taxSettings.tax_rate : 0;
    const discount = couponDiscount;
    
    // Calculate points discount
    const pointsDiscount = pointsToUse * pointsSettings.points_value;
    
    // Calculate payment method adjustment (cash discount or card surcharge)
    let paymentAdjustment = 0;
    let paymentAdjustmentLabel = '';
    if (dualPricingSettings.dual_pricing_enabled) {
      const baseTotal = subtotal + tax - discount - pointsDiscount;
      if (paymentMethod === 'cash' && dualPricingSettings.cash_discount_percent > 0) {
        paymentAdjustment = -(baseTotal * (dualPricingSettings.cash_discount_percent / 100));
        paymentAdjustmentLabel = `Cash Discount (${dualPricingSettings.cash_discount_percent}%)`;
      } else if ((paymentMethod === 'stripe' || paymentMethod === 'paypal') && dualPricingSettings.card_surcharge_percent > 0) {
        paymentAdjustment = baseTotal * (dualPricingSettings.card_surcharge_percent / 100);
        paymentAdjustmentLabel = `Card Fee (${dualPricingSettings.card_surcharge_percent}%)`;
      }
    }
    
    // Calculate points to be earned from this purchase
    const totalAfterDiscounts = subtotal + tax - discount - pointsDiscount + paymentAdjustment;
    const pointsEarned = pointsSettings.points_enabled ? Math.floor(totalAfterDiscounts * pointsSettings.points_per_dollar) : 0;
    
    const total = Math.max(0, subtotal + tax - discount - pointsDiscount + paymentAdjustment);
    return { 
      subtotal, 
      taxableSubtotal,
      tax, 
      discount,
      pointsDiscount,
      pointsEarned,
      paymentAdjustment,
      paymentAdjustmentLabel,
      total, 
      taxRate: taxSettings.tax_enabled ? taxSettings.tax_rate * 100 : 0 
    };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setProcessing(true);

    try {
      const saleData = {
        items: cart,
        payment_method: paymentMethod,
        created_by: user.username,
        customer_id: selectedCustomer ? selectedCustomer.id : undefined,
        customer_name: selectedCustomer ? selectedCustomer.name : (customerName || undefined),
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        points_to_use: pointsToUse
      };

      console.log('Submitting sale with customer data:', {
        customer_id: saleData.customer_id,
        customer_name: saleData.customer_name,
        coupon_code: saleData.coupon_code,
        points_to_use: saleData.points_to_use
      });

      const response = await axios.post(`${API}/sales`, saleData);

      if (paymentMethod === 'stripe') {
        // Create Stripe checkout session
        const checkoutData = {
          sale_id: response.data.id,
          origin_url: window.location.origin
        };

        const checkoutResponse = await axios.post(`${API}/payments/checkout`, checkoutData);

        // Redirect to Stripe
        window.location.href = checkoutResponse.data.url;
      } else if (paymentMethod === 'paypal') {
        // Create PayPal order
        const paypalData = {
          sale_id: response.data.id
        };

        const paypalResponse = await axios.post(`${API}/payments/paypal/create-order`, paypalData);

        // Redirect to PayPal
        window.location.href = paypalResponse.data.approval_url;
      } else {
        // Cash payment - clear cart and refresh
        alert('Sale completed successfully!');
        setCart([]);
        clearCustomer();
        setPaymentMethod('cash');
        removeCoupon();
        fetchInventory();
      }
    } catch (error) {
      console.error('Error processing sale:', error);
      alert('Error processing sale. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="loading-spinner"></div></div>;
  }

  const { subtotal, taxableSubtotal, tax, discount, pointsDiscount, pointsEarned, paymentAdjustment, paymentAdjustmentLabel, total, taxRate } = calculateTotal();

  // Check if customer can redeem points
  const canRedeemPoints = selectedCustomer && 
    pointsSettings.points_enabled && 
    selectedCustomer.points_info?.can_redeem && 
    selectedCustomer.points_balance > 0;
  
  const maxPointsToUse = selectedCustomer ? Math.min(
    selectedCustomer.points_balance || 0,
    Math.floor((subtotal + tax - discount) / pointsSettings.points_value) // Can't discount more than sale total
  ) : 0;

  return (
    <div data-testid="sales-page">
      <div className="page-header">
        <h1>Point of Sale</h1>
        <p>Process sales and transactions</p>
      </div>

      <div className="pos-container">
        <ProductSelection
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filteredInventory={filteredInventory}
          selectedCustomer={selectedCustomer}
          addToCart={addToCart}
        />

        <div className="cart-section">
          <div className="cart-header">
            <h3>Current Sale</h3>
          </div>

          <CartItems
            cart={cart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
          />

          <div className="cart-summary">
            <CartSummary
              subtotal={subtotal}
              taxableSubtotal={taxableSubtotal}
              taxSettings={taxSettings}
              taxRate={taxRate}
              tax={tax}
              discount={discount}
              pointsDiscount={pointsDiscount}
              paymentAdjustment={paymentAdjustment}
              paymentAdjustmentLabel={paymentAdjustmentLabel}
              total={total}
              pointsSettings={pointsSettings}
              pointsEarned={pointsEarned}
            />

            <CouponPanel
              appliedCoupon={appliedCoupon}
              removeCoupon={removeCoupon}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              applyCoupon={applyCoupon}
              couponError={couponError}
              cart={cart}
              availableCoupons={availableCoupons}
              showCouponList={showCouponList}
              setShowCouponList={setShowCouponList}
              selectCoupon={selectCoupon}
            />

            {pointsSettings.points_enabled && selectedCustomer && (
              <PointsPanel
                selectedCustomer={selectedCustomer}
                pointsSettings={pointsSettings}
                canRedeemPoints={canRedeemPoints}
                maxPointsToUse={maxPointsToUse}
                pointsToUse={pointsToUse}
                setPointsToUse={setPointsToUse}
              />
            )}

            <CustomerLookup
              customerAccountNumber={customerAccountNumber}
              setCustomerAccountNumber={setCustomerAccountNumber}
              searchCustomerByAccount={searchCustomerByAccount}
              customerSearchResults={customerSearchResults}
              showCustomerDropdown={showCustomerDropdown}
              setShowCustomerDropdown={setShowCustomerDropdown}
              selectedCustomer={selectedCustomer}
              selectCustomer={selectCustomer}
              clearCustomer={clearCustomer}
              customerName={customerName}
              setCustomerName={setCustomerName}
            />

            <CheckoutPanel
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              currentShift={currentShift}
              setShowOpenRegisterModal={setShowOpenRegisterModal}
              cart={cart}
              processing={processing}
              total={total}
              handleCheckout={handleCheckout}
              onClearCart={() => {
                if (cart.length > 0 && window.confirm('Are you sure you want to clear the cart?')) {
                  setCart([]);
                  clearCustomer();
                  setPaymentMethod('cash');
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Open Register Modal */}
      {showOpenRegisterModal && (
        <OpenRegisterModal
          openingAmount={openingAmount}
          setOpeningAmount={setOpeningAmount}
          registerMessage={registerMessage}
          onCancel={() => { setShowOpenRegisterModal(false); setOpeningAmount(""); setRegisterMessage(""); }}
          onConfirm={handleOpenRegister}
        />
      )}
    </div>
  );
};

export default Sales;