import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';

/** Cart line-items list with per-row qty +/− and remove. Pure presentational. */
export const CartItems = ({ cart, updateQuantity, removeFromCart }) => (
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
                <a href={item.gsm_arena_url} target="_blank" rel="noopener noreferrer" title="View on GSM Arena">
                  <img
                    src={item.image_url}
                    alt={item.item_name}
                    style={{
                      width: '60px', height: '60px', objectFit: 'cover',
                      borderRadius: '6px', cursor: 'pointer', transition: 'opacity 0.2s',
                    }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                    onMouseEnter={(e) => { e.target.style.opacity = '0.8'; }}
                    onMouseLeave={(e) => { e.target.style.opacity = '1'; }}
                  />
                </a>
              ) : (
                <img
                  src={item.image_url}
                  alt={item.item_name}
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
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
);

export default CartItems;
