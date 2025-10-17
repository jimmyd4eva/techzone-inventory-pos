import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus();
    }
  }, [sessionId]);

  const checkPaymentStatus = async () => {
    const token = localStorage.getItem('token');
    let attempts = 0;
    const maxAttempts = 5;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setStatus('timeout');
        return;
      }

      try {
        const response = await axios.get(`${API}/payments/status/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.payment_status === 'paid') {
          setStatus('success');
          setPaymentDetails(response.data);
        } else if (response.data.status === 'expired') {
          setStatus('expired');
        } else {
          attempts++;
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setStatus('error');
      }
    };

    poll();
  };

  return (
    <div data-testid="payment-success-page" style={{ textAlign: 'center', padding: '60px 20px' }}>
      {status === 'checking' && (
        <div>
          <Loader size={60} color="#667eea" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: '1.75rem', marginBottom: '12px' }}>Processing Payment</h2>
          <p style={{ color: '#64748b' }}>Please wait while we confirm your payment...</p>
        </div>
      )}

      {status === 'success' && (
        <div data-testid="payment-success">
          <CheckCircle size={80} color="#10b981" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '12px', color: '#10b981' }}>Payment Successful!</h2>
          <p style={{ color: '#64748b', marginBottom: '32px' }}>Your transaction has been completed successfully.</p>
          {paymentDetails && (
            <div style={{ 
              background: '#f8fafc', 
              padding: '24px', 
              borderRadius: '12px', 
              maxWidth: '400px', 
              margin: '0 auto 32px',
              textAlign: 'left'
            }}>
              <p style={{ marginBottom: '8px' }}><strong>Amount:</strong> ${(paymentDetails.amount_total / 100).toFixed(2)}</p>
              <p style={{ marginBottom: '8px' }}><strong>Status:</strong> {paymentDetails.payment_status}</p>
              <p><strong>Session ID:</strong> {sessionId}</p>
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
        <div data-testid="payment-error">
          <XCircle size={80} color="#ef4444" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '12px', color: '#ef4444' }}>Payment Error</h2>
          <p style={{ color: '#64748b', marginBottom: '32px' }}>There was an error processing your payment.</p>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/sales')}
            data-testid="retry-btn"
          >
            Try Again
          </button>
        </div>
      )}

      {(status === 'expired' || status === 'timeout') && (
        <div data-testid="payment-timeout">
          <XCircle size={80} color="#f59e0b" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '12px', color: '#f59e0b' }}>Session Expired</h2>
          <p style={{ color: '#64748b', marginBottom: '32px' }}>The payment session has expired. Please try again.</p>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/sales')}
            data-testid="return-btn"
          >
            Return to Sales
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccess;