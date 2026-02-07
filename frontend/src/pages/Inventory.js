import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, AlertTriangle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Items per page
  const [formData, setFormData] = useState({
    name: '',
    type: 'phone',
    sku: '',
    barcode: '',
    image_url: '',
    gsm_arena_url: '',
    quantity: 0,
    cost_price: 0,
    selling_price: 0,
    supplier: '',
    low_stock_threshold: 10
  });

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredItems(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm, items]);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

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

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data);
      setFilteredItems(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      if (editingItem) {
        await axios.put(`${API}/inventory/${editingItem.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API}/inventory`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchItems();
      closeModal();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/inventory/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        type: 'phone',
        sku: '',
        barcode: '',
        image_url: '',
        gsm_arena_url: '',
        quantity: 0,
        cost_price: 0,
        selling_price: 0,
        supplier: '',
        low_stock_threshold: 10
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  if (loading) {
    return <div className="loading-screen"><div className="loading-spinner"></div></div>;
  }

  return (
    <div data-testid="inventory-page">
      <div className="page-header">
        <h1>Inventory Management</h1>
        <p>Manage your products, parts, and accessories</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-bar">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="inventory-search"
            />
          </div>
          <button 
            className="btn btn-success" 
            onClick={() => openModal()}
            data-testid="add-inventory-btn"
          >
            <Plus size={18} />
            Add Item
          </button>
        </div>

        <div className="table-container">
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>No items found</h3>
              <p>Start by adding your first inventory item</p>
            </div>
          ) : (
            <>
              <table data-testid="inventory-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>SKU</th>
                  <th>Barcode</th>
                  <th>Quantity</th>
                  <th>Cost Price</th>
                  <th>Selling Price</th>
                  <th>Supplier</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item) => (
                  <tr key={item.id} data-testid={`inventory-item-${item.id}`}>
                    <td>
                      {item.image_url ? (
                        <a 
                          href={item.gsm_arena_url || 'https://www.gsmarena.com'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            style={{ 
                              width: '50px', 
                              height: '50px', 
                              objectFit: 'cover', 
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              cursor: 'pointer'
                            }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                            title={item.gsm_arena_url ? "Click to view on GSM Arena" : "GSM Arena URL not set"}
                          />
                        </a>
                      ) : (
                        <div style={{ 
                          width: '50px', 
                          height: '50px', 
                          background: '#f1f5f9',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem'
                        }}>
                          📦
                        </div>
                      )}
                    </td>
                    <td>
                      {item.name}
                      {item.quantity <= item.low_stock_threshold && (
                        <AlertTriangle size={14} color="#f59e0b" style={{ marginLeft: '8px' }} />
                      )}
                    </td>
                    <td><span className="badge">{item.type}</span></td>
                    <td>{item.sku}</td>
                    <td>{item.barcode || '-'}</td>
                    <td data-testid={`item-quantity-${item.id}`}>{item.quantity}</td>
                    <td>${item.cost_price.toFixed(2)}</td>
                    <td>${item.selling_price.toFixed(2)}</td>
                    <td>{item.supplier || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon"
                          onClick={() => openModal(item)}
                          data-testid={`edit-item-${item.id}`}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          className="btn-icon delete"
                          onClick={() => handleDelete(item.id)}
                          data-testid={`delete-item-${item.id}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {filteredItems.length > itemsPerPage && (
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
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length} items
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
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== 1) {
                        e.target.style.background = '#f8fafc';
                        e.target.style.borderColor = '#94a3b8';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== 1) {
                        e.target.style.background = 'white';
                        e.target.style.borderColor = '#cbd5e1';
                      }
                    }}
                  >
                    Previous
                  </button>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      // Show first page, last page, current page, and pages around current
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
                              minWidth: '40px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (currentPage !== pageNumber) {
                                e.target.style.background = '#f8fafc';
                                e.target.style.borderColor = '#94a3b8';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (currentPage !== pageNumber) {
                                e.target.style.background = 'white';
                                e.target.style.borderColor = '#cbd5e1';
                              }
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
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== totalPages) {
                        e.target.style.background = '#f8fafc';
                        e.target.style.borderColor = '#94a3b8';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== totalPages) {
                        e.target.style.background = 'white';
                        e.target.style.borderColor = '#cbd5e1';
                      }
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

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} data-testid="inventory-modal">
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
              <button className="btn-close" onClick={closeModal} data-testid="close-modal-btn">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Image URL (Optional)</label>
                  <input
                    type="text"
                    value={formData.image_url || ''}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    data-testid="item-image-input"
                    placeholder="https://example.com/image.jpg"
                  />
                  <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.85rem' }}>
                    Enter a direct link to an image (e.g., from Google Images, product websites)
                  </small>
                  {formData.image_url && formData.image_url.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <p style={{ fontSize: '0.9rem', marginBottom: '8px', color: '#334155' }}>Preview:</p>
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        style={{ 
                          width: '120px', 
                          height: '120px', 
                          objectFit: 'cover', 
                          borderRadius: '8px',
                          border: '2px solid #e2e8f0'
                        }}
                        onError={(e) => { 
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <p style={{ display: 'none', color: '#ef4444', fontSize: '0.85rem', marginTop: '8px' }}>
                        ❌ Could not load image. Please check the URL.
                      </p>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>GSM Arena URL (Optional)</label>
                  <input
                    type="text"
                    value={formData.gsm_arena_url || ''}
                    onChange={(e) => setFormData({ ...formData, gsm_arena_url: e.target.value })}
                    data-testid="item-gsmarena-input"
                    placeholder="https://www.gsmarena.com/apple_iphone_14-11829.php"
                  />
                  <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.85rem' }}>
                    Paste the full GSM Arena product page URL
                  </small>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      data-testid="item-name-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      data-testid="item-type-select"
                    >
                      <option value="phone">Phone</option>
                      <option value="part">Part</option>
                      <option value="accessory">Accessory</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>SKU</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      required
                      data-testid="item-sku-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Barcode (Optional)</label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      data-testid="item-barcode-input"
                      placeholder="Enter barcode number"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                      required
                      data-testid="item-quantity-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Low Stock Threshold</label>
                    <input
                      type="number"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) })}
                      required
                      data-testid="item-threshold-input"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Cost Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) })}
                      required
                      data-testid="item-cost-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Selling Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) })}
                      required
                      data-testid="item-price-input"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Supplier</label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      data-testid="item-supplier-input"
                      placeholder="Supplier name"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" data-testid="save-item-btn">
                  {editingItem ? 'Update' : 'Add'} Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;