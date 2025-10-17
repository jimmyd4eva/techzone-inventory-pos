import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Minus, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Sales = () => {
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventory(response.data.filter(item => item.quantity > 0));
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
        subtotal: item.selling_price
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
        created_by: user.username
      };

      const response = await axios.post(`${API}/sales`, saleData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (paymentMethod === 'stripe') {
        // Create checkout session
        const checkoutData = {
          sale_id: response.data.id,
          origin_url: window.location.origin
        };

        const checkoutResponse = await axios.post(`${API}/payments/checkout`, checkoutData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Redirect to Stripe
        window.location.href = checkoutResponse.data.url;
      } else {
        // Cash payment - clear cart and refresh
        alert('Sale completed successfully!');
        setCart([]);
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
            </div>
            <div className="items-grid">
              {inventory.length === 0 ? (
                <div className="empty-state">
                  <h3>No items in stock</h3>
                  <p>Add inventory items to start making sales</p>
                </div>
              ) : (
                inventory.map((item) => (
                  <div
                    key={item.id}
                    className="item-card"
                    onClick={() => addToCart(item)}
                    data-testid={`pos-item-${item.id}`}
                  >
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

            <div className="payment-methods">
              <button
                className={`payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
                data-testid="payment-cash-btn"
              >
                Cash
              </button>
              <button
                className={`payment-btn ${paymentMethod === 'stripe' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('stripe')}
                data-testid="payment-card-btn"
              >
                Card
              </button>
            </div>

            <button
              className="btn-checkout"
              onClick={handleCheckout}
              disabled={cart.length === 0 || processing}
              data-testid="checkout-btn"
            >
              {processing ? 'Processing...' : `Checkout - $${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;