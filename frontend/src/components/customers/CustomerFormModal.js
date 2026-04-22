import React from 'react';

export const CustomerFormModal = ({ formData, setFormData, editingCustomer, onSubmit, onClose }) => (
  <div className="modal-overlay" onClick={closeModal}>
    <div className="modal" onClick={(e) => e.stopPropagation()} data-testid="customer-modal">
      <div className="modal-header">
        <h2>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
        <button className="btn-close" onClick={closeModal} data-testid="close-modal-btn">
          ×
        </button>
      </div>
      <form onSubmit={onSubmit}>
        <div className="modal-body">
          <div className="form-group">
            <label>Account Number (Optional)</label>
            <input
              type="text"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value.toUpperCase() })}
              placeholder="Leave blank to use phone number"
              data-testid="customer-account-input"
              disabled={editingCustomer}
              style={{ background: editingCustomer ? '#f1f5f9' : 'white' }}
            />
            {!editingCustomer ? (
              <small style={{ color: '#667eea', fontSize: '0.85rem', display: 'block', marginTop: '4px' }}>
                💡 If left blank, last 4 digits of phone number will be used
              </small>
            ) : (
              <small style={{ color: '#64748b', fontSize: '0.85rem', display: 'block', marginTop: '4px' }}>
                Account number cannot be changed after creation
              </small>
            )}
          </div>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              data-testid="customer-name-input"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                data-testid="customer-phone-input"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="customer-email-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              data-testid="customer-address-input"
            />
          </div>
          <div className="form-group">
            <label>Customer Type</label>
            <select
              value={formData.customer_type}
              onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
              data-testid="customer-type-select"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
            >
              <option value="retail">Retail (Standard Pricing)</option>
              <option value="wholesale">Wholesale (Bulk Pricing)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Birthday (MM-DD, optional)</label>
            <input
              type="text"
              data-testid="customer-birthday-input"
              value={formData.birthday || ''}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              placeholder="03-15"
              pattern="^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$"
              title="Format: MM-DD (e.g. 03-15 for March 15)"
              style={{ width: '140px', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
            />
            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              Used for automated birthday-coupon emails. Format: MM-DD (e.g. 03-15). No year needed.
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={closeModal}>
            Cancel
          </button>
          <button type="submit" className="btn btn-success" data-testid="save-customer-btn">
            {editingCustomer ? 'Update' : 'Add'} Customer
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default CustomerFormModal;
