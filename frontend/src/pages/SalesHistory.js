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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Sales per page
  const [businessSettings, setBusinessSettings] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchSales();
    fetchSettings();
  }, []);

  useEffect(() => {
    const filtered = sales.filter(sale =>
      sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customer_name && sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      sale.created_by.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSales(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm, sales]);

  // Calculate pagination
  const indexOfLastSale = currentPage * itemsPerPage;
  const indexOfFirstSale = indexOfLastSale - itemsPerPage;
  const currentSales = filteredSales.slice(indexOfFirstSale, indexOfLastSale);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

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

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBusinessSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleDeleteSale = async (saleId) => {
    if (!window.confirm('Are you sure you want to delete this sale? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/sales/${saleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Sale deleted successfully!');
      fetchSales(); // Refresh the list
    } catch (error) {
      console.error('Error deleting sale:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to delete sale';
      alert(`Error: ${errorMsg}`);
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
            <>
              <table data-testid="sales-history-table">
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Coupon</th>
                    <th>Status</th>
                    <th>Cashier</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSales.map((sale) => (
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
                        {sale.coupon_code ? (
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            backgroundColor: '#d1fae5',
                            color: '#065f46',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontWeight: '600'
                          }}>
                            {sale.coupon_code}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${sale.payment_status}`}>
                          {sale.payment_status}
                        </span>
                      </td>
                      <td>{sale.created_by}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon"
                            onClick={() => handlePrintReceipt(sale)}
                            data-testid={`print-receipt-${sale.id}`}
                            title="Print Receipt"
                          >
                            <Printer size={18} />
                          </button>
                          {user?.role === 'admin' && (
                            <button
                              className="btn-icon delete"
                              onClick={() => handleDeleteSale(sale.id)}
                              data-testid={`delete-sale-${sale.id}`}
                              title="Delete Sale"
                              style={{
                                color: '#ef4444',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#dc2626';
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#ef4444';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {filteredSales.length > itemsPerPage && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '20px',
                  padding: '16px',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    Showing {indexOfFirstSale + 1} to {Math.min(indexOfLastSale, filteredSales.length)} of {filteredSales.length} sales
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        background: currentPage === 1 ? '#f1f5f9' : 'white',
                        color: currentPage === 1 ? '#94a3b8' : '#334155',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Previous
                    </button>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => goToPage(pageNumber)}
                              style={{
                                padding: '8px 12px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                background: currentPage === pageNumber ? '#667eea' : 'white',
                                color: currentPage === pageNumber ? 'white' : '#334155',
                                cursor: 'pointer',
                                fontWeight: currentPage === pageNumber ? '600' : '500',
                                minWidth: '40px'
                              }}
                            >
                              {pageNumber}
                            </button>
                          );
                        } else if (
                          pageNumber === currentPage - 2 ||
                          pageNumber === currentPage + 2
                        ) {
                          return <span key={pageNumber} style={{ padding: '8px 4px', color: '#94a3b8' }}>...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        background: currentPage === totalPages ? '#f1f5f9' : 'white',
                        color: currentPage === totalPages ? '#94a3b8' : '#334155',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedSale && (
        <>
          <Receipt 
            sale={selectedSale} 
            onClose={() => setSelectedSale(null)} 
          />
          {/* Test button to verify clicks work */}
          <button
            onClick={() => {
              alert('TEST BUTTON CLICKED!');
              window.print();
            }}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              padding: '20px 40px',
              backgroundColor: 'red',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold',
              border: '3px solid yellow',
              borderRadius: '10px',
              cursor: 'pointer',
              zIndex: 99999
            }}
          >
            TEST PRINT
          </button>
        </>
      )}
    </div>
  );
};

export default SalesHistory;
