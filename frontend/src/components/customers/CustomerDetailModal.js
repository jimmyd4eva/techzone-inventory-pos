import React from 'react';

export const CustomerDetailModal = ({ selectedCustomer, onClose, openCouponModal }) => (
  <div className="modal-overlay" onClick={closeDetailModal}>
    <div className="modal" onClick={(e) => e.stopPropagation()} data-testid="customer-detail-modal" style={{ maxWidth: '800px' }}>
      <div className="modal-header">
        <h2>Customer Profile</h2>
        <button className="btn-close" onClick={closeDetailModal} data-testid="close-detail-modal-btn">
          ×
        </button>
      </div>
      <div className="modal-body">
        <div style={{ marginBottom: '24px', padding: '16px', background: '#f0f4ff', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{selectedCustomer.name}</h3>
            <code style={{ 
              fontSize: '1rem', 
              fontWeight: '700', 
              color: '#667eea',
              background: 'white',
              padding: '6px 12px',
              borderRadius: '6px'
            }}>
              {selectedCustomer.account_number || 'N/A'}
            </code>
          </div>
          <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
          <p><strong>Email:</strong> {selectedCustomer.email || 'N/A'}</p>
          <p><strong>Address:</strong> {selectedCustomer.address || 'N/A'}</p>
          <p><strong>Customer Since:</strong> {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
          <div style={{ marginTop: '12px' }}>
            <button
              type="button"
              data-testid="generate-customer-coupon-btn"
              onClick={() => openCouponModal(selectedCustomer)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: '#7c3aed',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Ticket size={14} />
              Generate Personalized Coupon
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🛍️ Purchase History
            {selectedCustomer.purchase_history && selectedCustomer.purchase_history.length > 0 && (
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                ({selectedCustomer.purchase_history.length} transactions)
              </span>
            )}
          </h3>
          {selectedCustomer.purchase_history && selectedCustomer.purchase_history.length > 0 ? (
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {selectedCustomer.purchase_history.map((sale) => (
                <div 
                  key={sale.id} 
                  style={{
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <code style={{ fontSize: '0.75rem', color: '#667eea' }}>
                        {sale.id.substring(0, 8).toUpperCase()}
                      </code>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0' }}>
                        {sale.items.length} item(s)
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                        ${sale.total.toFixed(2)}
                      </p>
                      <span className={`badge ${sale.payment_method}`} style={{ fontSize: '0.75rem' }}>
                        {sale.payment_method}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    {new Date(sale.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
              No purchase history yet
            </p>
          )}
        </div>

        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔧 Repair History
            {selectedCustomer.repair_history && selectedCustomer.repair_history.length > 0 && (
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                ({selectedCustomer.repair_history.length} repairs)
              </span>
            )}
          </h3>
          {selectedCustomer.repair_history && selectedCustomer.repair_history.length > 0 ? (
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {selectedCustomer.repair_history.map((repair) => (
                <div 
                  key={repair.id} 
                  style={{
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong>{repair.device}</strong>
                    <span className={`badge ${repair.status}`}>{repair.status}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '4px' }}>
                    {repair.issue_description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8' }}>
                    <span>{new Date(repair.created_at).toLocaleDateString()}</span>
                    <span>${repair.cost.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
              No repair history
            </p>
          )}
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={closeDetailModal}>
          Close
        </button>
      </div>
    </div>
  </div>
);

export default CustomerDetailModal;
