import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    pin: ['', '', '', '']
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handlePinChange = (index, value) => {
    if (value.length > 1 || !/^\d*$/.test(value)) return;
    const newPin = [...formData.pin];
    newPin[index] = value;
    setFormData(prev => ({
      ...prev,
      pin: newPin
    }));
    setError('');

    // Auto-focus next input
    if (value && index < 3) {
      document.getElementById(`pin-${index + 1}`).focus();
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !formData.pin[index] && index > 0) {
      document.getElementById(`pin-${index - 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const pin = formData.pin.join('');
    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/login', {
        email: formData.email,
        password: formData.password,
        pin: pin
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    setError(`${provider} login is not yet implemented`);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-brand">SP Vault</h1>
        <h2 className="login-title">Login</h2>
        <p className="login-subtitle">Please sign in to your account</p>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="input-group">
            <div className="input-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2.5 6.66667L10 11.6667L17.5 6.66667M2.5 13.3333H17.5V6.66667H2.5V13.3333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          <div className="input-group">
            <div className="input-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 7.5C15 6.11929 13.8807 5 12.5 5H7.5C6.11929 5 5 6.11929 5 7.5V12.5C5 13.8807 6.11929 15 7.5 15H12.5C13.8807 15 15 13.8807 15 12.5V7.5Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 10C10.5523 10 11 9.55228 11 9C11 8.44772 10.5523 8 10 8C9.44772 8 9 8.44772 9 9C9 9.55228 9.44772 10 10 10Z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input-field"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                {showPassword ? (
                  <path d="M2.5 2.5L17.5 17.5M8.75 8.75C8.19772 9.30228 7.91667 10.0523 7.91667 10.8333C7.91667 12.214 9.03638 13.3333 10.4167 13.3333C11.1977 13.3333 11.9477 13.0523 12.5 12.5M15.4167 11.25C15.8333 10.4167 16.25 9.16667 16.25 7.5C16.25 4.16667 10.8333 2.5 10 2.5C9.16667 2.5 8.33333 2.66667 7.5 2.91667M5.83333 4.58333C4.16667 5.83333 2.91667 7.5 2.5 10C2.91667 12.5 5.41667 15 10 15C11.25 15 12.0833 14.5833 12.9167 14.1667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                ) : (
                  <path d="M10 4.16667C13.3333 4.16667 16.25 6.25 17.5 10C16.25 13.75 13.3333 15.8333 10 15.8333C6.66667 15.8333 3.75 13.75 2.5 10C3.75 6.25 6.66667 4.16667 10 4.16667ZM10 13.3333C12.7614 13.3333 15 11.0948 15 8.33333C15 5.5719 12.7614 3.33333 10 3.33333C7.23858 3.33333 5 5.5719 5 8.33333C5 11.0948 7.23858 13.3333 10 13.3333ZM10 10.8333C9.30964 10.8333 8.75 10.2737 8.75 9.58333C8.75 8.89298 9.30964 8.33333 10 8.33333C10.6904 8.33333 11.25 8.89298 11.25 9.58333C11.25 10.2737 10.6904 10.8333 10 10.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                )}
              </svg>
            </button>
          </div>

          <div className="pin-group">
            <label className="pin-label">PIN / OTP</label>
            <div className="pin-inputs">
              {formData.pin.map((digit, index) => (
                <input
                  key={index}
                  id={`pin-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  className="pin-input"
                />
              ))}
            </div>
          </div>

          <button type="submit" className="signin-button" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <div className="social-login">
          <button
            type="button"
            onClick={() => handleSocialLogin('Google')}
            className="social-button"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 8.33333V11.6667H15.8333C15.5833 12.9167 14.5833 14.5833 12.9167 15.4167L16.25 18.3333C18.75 16.25 20 13.3333 20 10C20 9.16667 19.9167 8.33333 19.75 7.5H10Z" fill="#4285F4"/>
              <path d="M4.16667 11.9167L3.75 12.0833L1.25 14.1667C3.33333 18.3333 7.5 20.8333 10 20.8333C12.9167 20.8333 15.4167 19.5833 16.9167 18.3333L13.5833 15.4167C12.5 16.0833 11.25 16.25 10 16.25C7.08333 16.25 4.58333 14.1667 3.75 11.25L4.16667 11.9167Z" fill="#34A853"/>
              <path d="M1.25 5.83333C0.416667 7.5 0 9.16667 0 10.8333C0 12.5 0.416667 14.1667 1.25 15.8333L4.16667 12.9167C3.75 11.6667 3.75 10.4167 3.75 9.16667C3.75 7.91667 4.16667 6.66667 4.58333 5.41667L1.25 5.83333Z" fill="#FBBC05"/>
              <path d="M10 3.75C11.6667 3.75 13.3333 4.58333 14.5833 5.41667L17.5 2.5C15.4167 0.833333 12.9167 0 10 0C7.5 0 3.33333 2.08333 1.25 6.25L4.58333 9.16667C5.41667 6.25 7.5 3.75 10 3.75Z" fill="#EA4335"/>
            </svg>
            <span>Google</span>
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin('Microsoft')}
            className="social-button"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" fill="#F25022"/>
              <rect x="11" y="2" width="7" height="7" fill="#7FBA00"/>
              <rect x="2" y="11" width="7" height="7" fill="#00A4EF"/>
              <rect x="11" y="11" width="7" height="7" fill="#FFB900"/>
            </svg>
            <span>Microsoft</span>
          </button>
        </div>

        <a href="#" className="forgot-password">Forgot password?</a>
        
        <div className="register-link">
          <span>Don't have an account? </span>
          <a href="/register">Sign up</a>
        </div>
      </div>
    </div>
  );
};

export default Login;

