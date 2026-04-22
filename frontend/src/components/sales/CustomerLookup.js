import React from 'react';

/** Customer lookup/search/selection panel. Also hosts the walk-in fallback. */
export const CustomerLookup = ({
  customerAccountNumber,
  setCustomerAccountNumber,
  searchCustomerByAccount,
  customerSearchResults,
  showCustomerDropdown,
  setShowCustomerDropdown,
  selectedCustomer,
  selectCustomer,
  clearCustomer,
  customerName,
  setCustomerName,
}) => (
  <div style={{
    marginTop: '16px', marginBottom: '16px',
    padding: '12px', background: '#f8fafc', borderRadius: '8px',
  }}>
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>
      Customer Lookup (Optional)
    </label>
    <small style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#64748b' }}>
      Search by account #, name, or phone number
    </small>
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={customerAccountNumber}
        onChange={(e) => { setCustomerAccountNumber(e.target.value); searchCustomerByAccount(e.target.value); }}
        onFocus={(e) => {
          e.target.style.borderColor = '#667eea';
          if (customerSearchResults.length > 0) setShowCustomerDropdown(true);
        }}
        placeholder="Enter account #, name, or phone..."
        data-testid="customer-account-input"
        disabled={!!selectedCustomer}
        style={{
          width: '100%', padding: '10px',
          border: '1px solid #cbd5e1', borderRadius: '6px',
          fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s',
          background: selectedCustomer ? '#e2e8f0' : 'white',
        }}
        onBlur={(e) => setTimeout(() => {
          e.target.style.borderColor = '#cbd5e1';
          setShowCustomerDropdown(false);
        }, 300)}
      />

      {showCustomerDropdown && customerSearchResults.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px',
          marginTop: '4px', maxHeight: '200px', overflowY: 'auto',
          zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}>
          {customerSearchResults.map((customer) => (
            <div
              key={customer.id}
              onClick={() => selectCustomer(customer)}
              style={{
                padding: '10px', cursor: 'pointer',
                borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>{customer.name}</span>
                <span style={{
                  fontSize: '0.65rem', fontWeight: '600', padding: '1px 4px', borderRadius: '3px',
                  background: customer.customer_type === 'wholesale' ? '#dbeafe' : '#f0fdf4',
                  color: customer.customer_type === 'wholesale' ? '#1d4ed8' : '#166534',
                }}>
                  {(customer.customer_type || 'retail').toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {customer.account_number} • {customer.phone}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {selectedCustomer && (
      <div style={{
        marginTop: '12px', padding: '10px',
        background: selectedCustomer.customer_type === 'wholesale' ? '#dbeafe' : '#e0f2fe',
        borderRadius: '6px',
        border: selectedCustomer.customer_type === 'wholesale' ? '1px solid #93c5fd' : '1px solid #7dd3fc',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '600', color: '#0c4a6e' }}>{selectedCustomer.name}</span>
              <span style={{
                fontSize: '0.7rem', fontWeight: '600',
                padding: '2px 6px', borderRadius: '4px',
                background: selectedCustomer.customer_type === 'wholesale' ? '#1d4ed8' : '#059669',
                color: 'white',
              }}>
                {(selectedCustomer.customer_type || 'retail').toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#075985' }}>
              {selectedCustomer.account_number} • {selectedCustomer.phone}
            </div>
            {selectedCustomer.customer_type === 'wholesale' && (
              <div style={{ fontSize: '0.75rem', color: '#1d4ed8', marginTop: '4px' }}>
                Wholesale prices applied
              </div>
            )}
          </div>
          <button
            onClick={clearCustomer}
            style={{
              background: '#ef4444', color: 'white', border: 'none',
              borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
      </div>
    )}

    {!selectedCustomer && (
      <>
        <button
          type="button"
          onClick={clearCustomer}
          style={{
            marginTop: '12px', width: '100%', padding: '8px',
            background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px',
            color: '#475569', fontSize: '0.9rem', cursor: 'pointer',
            fontWeight: '500', transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.borderColor = '#94a3b8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
        >
          👤 Skip - Continue as Walk-in Customer
        </button>

        <label style={{
          display: 'block', marginTop: '12px', marginBottom: '8px',
          fontWeight: '600', fontSize: '0.9rem', color: '#334155',
        }}>
          Or Enter Name Manually
        </label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Customer name..."
          data-testid="customer-name-input"
          style={{
            width: '100%', padding: '10px',
            border: '1px solid #cbd5e1', borderRadius: '6px',
            fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { e.target.style.borderColor = '#667eea'; }}
          onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; }}
        />
      </>
    )}
  </div>
);

export default CustomerLookup;
