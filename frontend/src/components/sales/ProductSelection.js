import React from 'react';
import { Search } from 'lucide-react';

export const ProductSelection = ({
  searchTerm, setSearchTerm,
  filteredInventory, selectedCustomer, addToCart,
  inventory,
}) => {
  // Enter on the search input adds the first visible product to cart — lets
  // cashiers scan/type a SKU and tap Enter without reaching for the mouse.
  // USB barcode scanners emit the digits + a trailing Enter as if typed on a
  // keyboard. When the current search term matches a barcode or SKU *exactly*
  // we add THAT item (even if a prefix-match ranks higher in the list) so a
  // scan of 012345 always resolves to the right product.
  const onSearchKey = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const q = (searchTerm || '').trim();
    if (!q) return;
    const source = inventory?.length ? inventory : filteredInventory;
    const exact = source.find(
      (it) =>
        (it.barcode && it.barcode === q) ||
        (it.sku && it.sku.toLowerCase() === q.toLowerCase())
    );
    const target = exact || filteredInventory[0];
    if (target) {
      addToCart(target);
      // Reset the search so the next scan starts fresh. Quintessential POS flow.
      setSearchTerm('');
    }
  };
  return (
<div className="items-section">
  <div className="card">
    <div className="card-header">
      <h2>Select Items</h2>
      <div className="search-bar" style={{ marginLeft: 'auto', maxWidth: '300px' }}>
        <Search className="search-icon" size={20} />
        <input
          type="text"
          placeholder="Search or scan barcode / SKU... (F2 to focus, Enter to add)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={onSearchKey}
          data-testid="product-search-input"
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
};

export default ProductSelection;
