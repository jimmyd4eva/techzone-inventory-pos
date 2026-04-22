import React from 'react';
import { Wallet } from 'lucide-react';

export const OpenRegisterModal = ({ openingAmount, setOpeningAmount, registerMessage, onCancel, onConfirm }) => (
<div style={{
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
}}>
  <div style={{
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
  }}>
    <h2 style={{ 
      margin: '0 0 16px 0', 
      fontSize: '20px', 
      fontWeight: '600', 
      color: '#374151',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }}>
      <Wallet size={24} style={{ color: '#059669' }} />
      Open Cash Register
    </h2>
    
    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
      Count the cash in your drawer and enter the starting amount to begin your shift.
    </p>

    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
        Opening Cash Amount
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{ 
          position: 'absolute', 
          left: '12px', 
          top: '50%', 
          transform: 'translateY(-50%)', 
          color: '#9ca3af',
          fontSize: '18px'
        }}>$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={openingAmount}
          onChange={(e) => setOpeningAmount(e.target.value)}
          placeholder="0.00"
          data-testid="modal-opening-amount"
          autoFocus
          style={{
            width: '100%',
            padding: '14px 16px 14px 32px',
            border: '2px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '500'
          }}
        />
      </div>
    </div>

    {registerMessage && (
      <p style={{ 
        color: '#dc2626', 
        fontSize: '13px', 
        marginBottom: '16px',
        padding: '8px 12px',
        backgroundColor: '#fee2e2',
        borderRadius: '6px'
      }}>
        {registerMessage}
      </p>
    )}

    <div style={{ display: 'flex', gap: '12px' }}>
      <button
        onClick={onCancel}
        style={{
          flex: 1,
          padding: '12px',
          backgroundColor: '#f3f4f6',
          color: '#374151',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: '500',
          cursor: 'pointer'
        }}
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        data-testid="modal-open-register-btn"
        style={{
          flex: 1,
          padding: '12px',
          backgroundColor: '#059669',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <Wallet size={18} />
        Open Register
      </button>
    </div>
  </div>
</div>
);

export default OpenRegisterModal;
