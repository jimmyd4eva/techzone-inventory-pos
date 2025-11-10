import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Printer, Trash2 } from 'lucide-react';
import Receipt from '../components/Receipt';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    const filtered = sales.filter(sale =>
      sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customer_name && sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      sale.created_by.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSales(filtered);
  }, [searchTerm, sales]);

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSales(response.data);
      setFilteredSales(response.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = (sale) => {
    setSelectedSale(sale);
  };

  if (loading) {
    return <div className="loading-screen"><div className="loading-spinner"></div></div>;
  }

  return (
    <div data-testid="sales-history-page">
      <div className="page-header">
        <h1>Sales History</h1>
        <p>View and print receipts for past transactions</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-bar">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="sales-search"
            />
          </div>
        </div>

        <div className="table-container">
          {filteredSales.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧾</div>
              <h3>No sales found</h3>
              <p>Sales transactions will appear here</p>
            </div>
          ) : (
            <table data-testid="sales-history-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Cashier</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} data-testid={`sale-${sale.id}`}>
                    <td>
                      <code style={{ fontSize: '0.85rem', color: '#667eea' }}>
                        {sale.id.substring(0, 8).toUpperCase()}
                      </code>
                    </td>
                    <td>{new Date(sale.created_at).toLocaleString()}</td>
                    <td>{sale.customer_name || 'Walk-in'}</td>
                    <td>
                      <div style={{ maxWidth: '250px' }}>
                        {sale.items.map((item, idx) => (
                          <div key={idx} style={{ 
                            fontSize: '0.85rem', 
                            marginBottom: '4px',
                            padding: '4px 8px',
                            background: '#f8fafc',
                            borderRadius: '4px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span style={{ fontWeight: '500' }}>{item.item_name}</span>
                            <span style={{ 
                              color: '#64748b', 
                              marginLeft: '8px',
                              fontSize: '0.8rem'
                            }}>
                              x{item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontWeight: '600' }}>${sale.total.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${sale.payment_method}`}>
                        {sale.payment_method}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${sale.payment_status}`}>
                        {sale.payment_status}
                      </span>
                    </td>
                    <td>{sale.created_by}</td>
                    <td>
                      <button
                        className="btn-icon"
                        onClick={() => handlePrintReceipt(sale)}
                        data-testid={`print-receipt-${sale.id}`}
                        title="Print Receipt"
                      >
                        <Printer size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedSale && (
        <Receipt 
          sale={selectedSale} 
          onClose={() => setSelectedSale(null)} 
        />
      )}
    </div>
  );
};

export default SalesHistory;
