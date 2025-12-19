// OTP utility: generates and stores OTP codes for email-based MFA
const crypto = require('crypto');

// In-memory storage for OTPs (in production, use Redis or database)
const otpStore = new Map();

// Generate 6-digit OTP code
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Store OTP with expiration (default 10 minutes)
const storeOTP = (email, otp, expiresInMinutes = 10) => {
  const expiresAt = Date.now() + (expiresInMinutes * 60 * 1000);
  otpStore.set(email, {
    otp,
    expiresAt,
    attempts: 0,
    maxAttempts: 5
  });
  
  // Clean up expired OTPs
  setTimeout(() => {
    otpStore.delete(email);
  }, expiresInMinutes * 60 * 1000);
};

// Verify OTP code
const verifyOTP = (email, otp) => {
  const stored = otpStore.get(email);
  
  if (!stored) {
    return { valid: false, message: 'OTP not found or expired' };
  }
  
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return { valid: false, message: 'OTP expired' };
  }
  
  if (stored.attempts >= stored.maxAttempts) {
    otpStore.delete(email);
    return { valid: false, message: 'Too many failed attempts. Please request a new OTP' };
  }
  
  if (stored.otp !== otp) {
    stored.attempts++;
    return { valid: false, message: 'Invalid OTP code' };
  }
  
  // OTP is valid, remove it
  otpStore.delete(email);
  return { valid: true };
};

// Get OTP info (for debugging)
const getOTPInfo = (email) => {
  return otpStore.get(email);
};

// Delete OTP (for cleanup)
const deleteOTP = (email) => {
  otpStore.delete(email);
};

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  getOTPInfo,
  deleteOTP
};


