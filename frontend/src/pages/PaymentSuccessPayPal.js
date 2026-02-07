import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentSuccessPayPal = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const token = searchParams.get('token'); // PayPal order ID

  useEffect(() => {
    if (token) {
      capturePayment();
    }
  }, [token]);

  const capturePayment = async () => {
    const authToken = localStorage.getItem('token');

    try {
      const response = await axios.post(`${API}/payments/paypal/capture/${token}`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.data.payment_status === 'completed') {
        setStatus('success');
        setPaymentDetails(response.data);
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Error capturing PayPal payment:', error);
      setStatus('error');
    }
  };

  return (
    <div data-testid="paypal-success-page" style={{ textAlign: 'center', padding: '60px 20px' }}>
      {status === 'processing' && (
        <div>
          <Loader size={60} color="#667eea" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: '1.75rem', marginBottom: '12px' }}>Processing PayPal Payment</h2>
          <p style={{ color: '#64748b' }}>Please wait while we confirm your payment...</p>
        </div>
      )}

      {status === 'success' && (
        <div data-testid="paypal-success">
          <CheckCircle size={80} color="#10b981" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '12px', color: '#10b981' }}>Payment Successful!</h2>
          <p style={{ color: '#64748b', marginBottom: '32px' }}>Your PayPal transaction has been completed successfully.</p>
          {paymentDetails && (
            <div style={{ 
              background: '#f8fafc', 
              padding: '24px', 
              borderRadius: '12px', 
              maxWidth: '400px', 
              margin: '0 auto 32px',
              textAlign: 'left'
            }}>
              <p style={{ marginBottom: '8px' }}><strong>Status:</strong> {paymentDetails.status}</p>
              <p><strong>Order ID:</strong> {paymentDetails.order_id}</p>
            </div>
          )}
          <button 
            className="btn btn-success"
            onClick={() => navigate('/sales')}
            data-testid="back-to-sales-btn"
          >
            Back to Sales
          </button>
        </div>
      )}

      {status === 'error' && (
        <div data-testid="paypal-error">
          <XCircle size={80} color="#ef4444" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '12px', color: '#ef4444' }}>Payment Error</h2>
          <p style={{ color: '#64748b', marginBottom: '32px' }}>There was an error processing your PayPal payment.</p>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/sales')}
            data-testid="retry-btn"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccessPayPal;
