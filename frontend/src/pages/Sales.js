import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Minus, Trash2, Search } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Sales = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchInventory();
  }, []);

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
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const inStockItems = response.data.filter(item => item.quantity > 0);
      setInventory(inStockItems);
      setFilteredInventory(inStockItems);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find(i => i.item_id === item.id);
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
        price: item.selling_price,
        subtotal: item.selling_price,
        image_url: item.image_url,
        gsm_arena_url: item.gsm_arena_url
      }]);
    }
  };

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
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setProcessing(true);
    const token = localStorage.getItem('token');

    try {
      const saleData = {
        items: cart,
        payment_method: paymentMethod,
        created_by: user.username,
        customer_name: customerName || undefined
      };

      const response = await axios.post(`${API}/sales`, saleData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (paymentMethod === 'stripe') {
        // Create Stripe checkout session
        const checkoutData = {
          sale_id: response.data.id,
          origin_url: window.location.origin
        };

        const checkoutResponse = await axios.post(`${API}/payments/checkout`, checkoutData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Redirect to Stripe
        window.location.href = checkoutResponse.data.url;
      } else if (paymentMethod === 'paypal') {
        // Create PayPal order
        const paypalData = {
          sale_id: response.data.id
        };

        const paypalResponse = await axios.post(`${API}/payments/paypal/create-order`, paypalData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Redirect to PayPal
        window.location.href = paypalResponse.data.approval_url;
      } else {
        // Cash payment - clear cart and refresh
        alert('Sale completed successfully!');
        setCart([]);
        setCustomerName('');
        setPaymentMethod('cash');
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

  const { subtotal, tax, total } = calculateTotal();

  return (
    <div data-testid="sales-page">
      <div className="page-header">
        <h1>Point of Sale</h1>
        <p>Process sales and transactions</p>
      </div>

      <div className="pos-container">
        <div className="items-section">
          <div className="card">
            <div className="card-header">
              <h2>Select Items</h2>
              <div className="search-bar" style={{ marginLeft: 'auto', maxWidth: '300px' }}>
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="sales-search"
                />
              </div>
            </div>
            <div className="items-grid">
              {filteredInventory.length === 0 ? (
                <div className="empty-state">
                  <h3>{searchTerm ? 'No items found' : 'No items in stock'}</h3>
                  <p>{searchTerm ? 'Try a different search term' : 'Add inventory items to start making sales'}</p>
                </div>
              ) : (
                filteredInventory.map((item) => (
                  <div
                    key={item.id}
                    className="item-card"
                    onClick={() => addToCart(item)}
                    data-testid={`pos-item-${item.id}`}
                  >
                    {item.image_url ? (
                      <a 
                        href={item.gsmarena_url || 'https://www.gsmarena.com'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title={item.gsmarena_url ? "Click to view on GSM Arena" : "GSM Arena URL not set"}
                      >
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          style={{ 
                            width: '100%', 
                            height: '100px', 
                            objectFit: 'cover', 
                            borderRadius: '8px',
                            marginBottom: '12px',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s'
                          }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                          onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
                        />
                      </a>
                    ) : (
                      <div style={{ 
                        width: '100%', 
                        height: '100px', 
                        background: '#f1f5f9',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        marginBottom: '12px'
                      }}>
                        📦
                      </div>
                    )}
                    <h4>{item.name}</h4>
                    <p>{item.type}</p>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Stock: {item.quantity}</p>
                    <div className="price">${item.selling_price.toFixed(2)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="cart-section">
          <div className="cart-header">
            <h3>Current Sale</h3>
          </div>

          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-state">
                <p>Cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.item_id} className="cart-item" data-testid={`cart-item-${item.item_id}`}>
                  {item.image_url && (
                    <div className="cart-item-image">
                      {item.gsm_arena_url ? (
                        <a 
                          href={item.gsm_arena_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          title="View on GSM Arena"
                        >
                          <img 
                            src={item.image_url} 
                            alt={item.item_name}
                            style={{ 
                              width: '60px', 
                              height: '60px', 
                              objectFit: 'cover', 
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'opacity 0.2s'
                            }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                          />
                        </a>
                      ) : (
                        <img 
                          src={item.image_url} 
                          alt={item.item_name}
                          style={{ 
                            width: '60px', 
                            height: '60px', 
                            objectFit: 'cover', 
                            borderRadius: '6px'
                          }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                    </div>
                  )}
                  <div className="cart-item-info">
                    <h4>{item.item_name}</h4>
                    <p>${item.price.toFixed(2)} each</p>
                  </div>
                  <div className="cart-item-qty">
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.item_id, -1)}
                      data-testid={`decrease-qty-${item.item_id}`}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="qty-value" data-testid={`qty-${item.item_id}`}>{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.item_id, 1)}
                      data-testid={`increase-qty-${item.item_id}`}
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      className="btn-icon delete"
                      onClick={() => removeFromCart(item.item_id)}
                      data-testid={`remove-item-${item.item_id}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span data-testid="cart-subtotal">${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax (10%):</span>
              <span data-testid="cart-tax">${tax.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span data-testid="cart-total">${total.toFixed(2)}</span>
            </div>

            <div style={{ 
              marginTop: '16px', 
              marginBottom: '16px',
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '8px'
            }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                fontSize: '0.9rem',
                color: '#334155'
              }}>
                Customer Name (Optional)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name..."
                data-testid="customer-name-input"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>

            <div className="payment-methods">
              <button
                className={`payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
                data-testid="payment-cash-btn"
              >
                💵 Cash
              </button>
              <button
                className={`payment-btn ${paymentMethod === 'stripe' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('stripe')}
                data-testid="payment-card-btn"
              >
                💳 Credit Card/Debit Card
              </button>
            </div>

            <button
              className="btn-checkout"
              onClick={handleCheckout}
              disabled={cart.length === 0 || processing}
              data-testid="checkout-btn"
              style={{ marginBottom: '10px' }}
            >
              {processing ? 'Processing...' : `Checkout - $${total.toFixed(2)}`}
            </button>
            
            <button
              className="btn-secondary"
              onClick={() => {
                if (cart.length > 0 && window.confirm('Are you sure you want to clear the cart?')) {
                  setCart([]);
                  setPaymentMethod('cash');
                }
              }}
              disabled={cart.length === 0}
              data-testid="cancel-sale-btn"
              style={{
                width: '100%',
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                background: cart.length === 0 ? '#e2e8f0' : '#ef4444',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                opacity: cart.length === 0 ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (cart.length > 0) e.target.style.background = '#dc2626';
              }}
              onMouseLeave={(e) => {
                if (cart.length > 0) e.target.style.background = '#ef4444';
              }}
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;