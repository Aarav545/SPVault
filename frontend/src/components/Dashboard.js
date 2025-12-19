// Dashboard component: main password vault interface with CRUD operations
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Get API base URL - hardcoded for VM deployment (Backend VM IP)
  const API_BASE = 'http://172.16.190.142:5001';

  // Get auth token for API requests
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // Verify authentication and load user data on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    if (token) {
      axios.get(`${API_BASE}/api/auth/verify`, { headers: getAuthHeaders() })
        .then(response => {
          setUser(response.data.user);
          setLoading(false);
          loadEntries();
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        });
    } else {
      window.location.href = '/login';
    }
  }, []);

  // Load all password entries from backend
  const loadEntries = async () => {
    try {
      console.log('Loading entries from:', `${API_BASE}/api/vault/entries`);
      setEntriesLoading(true);
      const response = await axios.get(`${API_BASE}/api/vault/entries`, {
        headers: getAuthHeaders()
      });
      console.log('Entries loaded:', response.data);
      console.log('Number of entries:', response.data.entries?.length || 0);
      setEntries(response.data.entries || []);
    } catch (error) {
      console.error('Error loading entries:', error);
      console.error('Error response:', error.response);
      setEntries([]);
    } finally {
      setEntriesLoading(false);
    }
  };

  // Handle logout - clears authentication and redirects
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Open modal for adding new entry
  const handleAddEntry = () => {
    setEditingEntry(null);
    setShowModal(true);
  };

  // Open modal for editing existing entry
  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setShowModal(true);
  };

  // Delete password entry
  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/api/vault/entries/${id}`, {
        headers: getAuthHeaders()
      });
      loadEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry');
    }
  };

  // Copy password to clipboard
  const handleCopyPassword = (password) => {
    navigator.clipboard.writeText(password).then(() => {
      alert('Password copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy password');
    });
  };

  // Filter entries based on search term and category
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || entry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from entries
  const categories = ['All', ...new Set(entries.map(e => e.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <h1 className="dashboard-brand">SP Vault</h1>
        <div className="nav-user">
          <span className="user-email">{user?.email}</span>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </nav>
      
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h2>My Passwords</h2>
            <p>Manage your secure password vault</p>
          </div>
          <button onClick={handleAddEntry} className="add-button">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add Password
          </button>
        </div>

        <div className="dashboard-filters">
          <div className="search-box">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M9.16667 15.8333C12.8486 15.8333 15.8333 12.8486 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17.5 17.5L13.875 13.875" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search passwords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-filter"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {entriesLoading ? (
          <div className="entries-loading">
            <div className="loading-spinner"></div>
            <p>Loading passwords...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 20 20" fill="none">
              <path d="M15 7.5C15 6.11929 13.8807 5 12.5 5H7.5C6.11929 5 5 6.11929 5 7.5V12.5C5 13.8807 6.11929 15 7.5 15H12.5C13.8807 15 15 13.8807 15 12.5V7.5Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 10C10.5523 10 11 9.55228 11 9C11 8.44772 10.5523 8 10 8C9.44772 8 9 8.44772 9 9C9 9.55228 9.44772 10 10 10Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <h3>No passwords found</h3>
            <p>{entries.length === 0 ? 'Get started by adding your first password' : 'Try adjusting your search or filters'}</p>
            {entries.length === 0 && (
              <button onClick={handleAddEntry} className="add-button">Add Your First Password</button>
            )}
          </div>
        ) : (
          <div className="entries-grid">
            {filteredEntries.map(entry => (
              <div key={entry._id} className="entry-card">
                <div className="entry-header">
                  <div className="entry-icon">
                    {entry.url ? (
                      <>
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${entry.url}&sz=32`}
                          alt=""
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="entry-icon-fallback" style={{ display: 'none' }}>
                          {entry.title.charAt(0).toUpperCase()}
                        </div>
                      </>
                    ) : (
                      <div className="entry-icon-fallback">
                        {entry.title.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="entry-actions">
                    <button onClick={() => handleEditEntry(entry)} className="icon-button" title="Edit">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                        <path d="M11.25 3.75L16.25 8.75M14.1667 2.5L17.5 5.83333L10.8333 12.5H7.5V9.16667L14.1667 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M15.8333 11.6667V15.8333C15.8333 16.2754 15.6577 16.6993 15.3451 17.0118C15.0326 17.3244 14.6087 17.5 14.1667 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V5.83333C2.5 5.39131 2.67559 4.96738 2.98816 4.65482C3.30072 4.34226 3.72464 4.16667 4.16667 4.16667H8.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button onClick={() => handleDeleteEntry(entry._id)} className="icon-button delete" title="Delete">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                        <path d="M4.16667 5.83333H15.8333M8.33333 9.16667V13.3333M11.6667 9.16667V13.3333M6.66667 5.83333V15.8333C6.66667 16.2754 6.84226 16.6993 7.15482 17.0118C7.46738 17.3244 7.89131 17.5 8.33333 17.5H11.6667C12.1087 17.5 12.5326 17.3244 12.8452 17.0118C13.1577 16.6993 13.3333 16.2754 13.3333 15.8333V5.83333M8.33333 3.75V5.83333M11.6667 3.75V5.83333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="entry-body">
                  <h3 className="entry-title">{entry.title}</h3>
                  {entry.username && (
                    <div className="entry-field">
                      <span className="field-label">Username:</span>
                      <span className="field-value">{entry.username}</span>
                    </div>
                  )}
                  <div className="entry-field">
                    <span className="field-label">Password:</span>
                    <div className="password-field">
                      <span className="field-value password-masked">••••••••</span>
                      <button
                        onClick={() => handleCopyPassword(entry.password)}
                        className="copy-button"
                        title="Copy password"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                          <path d="M8.33333 8.33333H5.83333C4.91286 8.33333 4.16667 9.07952 4.16667 10V14.1667C4.16667 15.0871 4.91286 15.8333 5.83333 15.8333H10C10.9205 15.8333 11.6667 15.0871 11.6667 14.1667V11.6667M15.8333 4.16667H11.6667C10.7462 4.16667 10 4.91286 10 5.83333V10C10 10.9205 10.7462 11.6667 11.6667 11.6667H15.8333C16.7538 11.6667 17.5 10.9205 17.5 10V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  {entry.url && (
                    <div className="entry-field">
                      <span className="field-label">URL:</span>
                      <a href={entry.url} target="_blank" rel="noopener noreferrer" className="field-link">
                        {entry.url}
                      </a>
                    </div>
                  )}
                  {entry.category && (
                    <div className="entry-category">
                      <span>{entry.category}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <PasswordModal
            entry={editingEntry}
            onClose={() => {
              setShowModal(false);
              setEditingEntry(null);
            }}
            onSave={() => {
              setShowModal(false);
              setEditingEntry(null);
              loadEntries();
            }}
            apiBase={API_BASE}
            getAuthHeaders={getAuthHeaders}
          />
        )}
      </main>
    </div>
  );
};

// Password Modal Component: form for adding/editing password entries
const PasswordModal = ({ entry, onClose, onSave, apiBase, getAuthHeaders }) => {
  const [formData, setFormData] = useState({
    title: entry?.title || '',
    username: entry?.username || '',
    password: entry?.password || '',
    url: entry?.url || '',
    notes: entry?.notes || '',
    category: entry?.category || 'General'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  // Generate random password
  const handleGeneratePassword = async () => {
    try {
      const response = await axios.post(`${apiBase}/api/vault/generate`, {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true
      }, { headers: getAuthHeaders() });
      setGeneratedPassword(response.data.password);
      setFormData(prev => ({ ...prev, password: response.data.password }));
    } catch (error) {
      console.error('Error generating password:', error);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Submitting form with data:', formData);
    console.log('API Base URL:', apiBase);
    console.log('Auth headers:', getAuthHeaders());

    try {
      let response;
      const url = entry 
        ? `${apiBase}/api/vault/entries/${entry._id}`
        : `${apiBase}/api/vault/entries`;
      
      console.log('Making request to:', url);
      console.log('Request payload:', formData);
      
      if (entry) {
        // Update existing entry
        response = await axios.put(url, formData, {
          headers: getAuthHeaders()
        });
      } else {
        // Create new entry
        response = await axios.post(url, formData, {
          headers: getAuthHeaders()
        });
      }
      
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      // Only call onSave if request was successful
      if (response.status === 201 || response.status === 200) {
        console.log('Entry saved successfully, closing modal and reloading entries');
        onSave();
      } else {
        throw new Error('Unexpected response status: ' + response.status);
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors.map(err => err.msg).join(', ');
        setError(error.response.data.message + ': ' + validationErrors);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError('Failed to save entry: ' + error.message);
      } else {
        setError('Failed to save entry. Please check your connection and try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{entry ? 'Edit Password' : 'Add New Password'}</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Gmail, Facebook"
            />
          </div>

          <div className="form-group">
            <label>Username/Email</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="username@example.com"
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <div className="password-input-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="password-actions">
              <button
                type="button"
                onClick={() => setShowGenerator(!showGenerator)}
                className="link-button"
              >
                {showGenerator ? 'Hide' : 'Generate'} Password
              </button>
              {showGenerator && (
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="generate-button"
                >
                  Generate
                </button>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>URL/Website</label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="General, Work, Personal, etc."
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Additional notes..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="save-button" disabled={loading}>
              {loading ? 'Saving...' : entry ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
