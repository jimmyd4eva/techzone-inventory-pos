import React from 'react';
import { Search } from 'lucide-react';

export const ProductSelection = ({
  searchTerm, setSearchTerm,
  filteredInventory, selectedCustomer, addToCart,
}) => (
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
            {selectedCustomer?.customer_type === 'wholesale' && item.wholesale_price ? (
              <div>
                <div className="price" style={{ color: '#1d4ed8' }}>${item.wholesale_price.toFixed(2)}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                  ${item.selling_price.toFixed(2)}
                </div>
              </div>
            ) : (
              <div className="price">${item.selling_price.toFixed(2)}</div>
            )}
          </div>
        ))
      )}
    </div>
  </div>
</div>
);

export default ProductSelection;
