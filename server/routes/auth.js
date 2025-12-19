// Authentication routes: handles user registration, login, and token verification
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { generateOTP, storeOTP, verifyOTP } = require('../utils/otp');
const { sendOTPEmail } = require('../utils/email');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// POST /register: Register a new user account
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('pin').isLength({ min: 4, max: 4 }).isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password, pin } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      pin
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login (skip validation since PIN is already hashed)
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id.toString(),
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /login - Authenticate user credentials and send OTP via email
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  body('pin').isLength({ min: 4, max: 4 }).isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password, pin } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify PIN
    const isPinValid = await user.comparePin(pin);
    if (!isPinValid) {
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    // Generate and send OTP via email
    const otp = generateOTP();
    storeOTP(email, otp, 10); // Store OTP for 10 minutes

    const emailResult = await sendOTPEmail(email, otp);
    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error);
      return res.status(500).json({ 
        message: 'Failed to send verification code. Please try again.' 
      });
    }

    res.json({
      message: 'Verification code sent to your email',
      requiresOTP: true
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /login/verify-otp - Verify OTP and complete login
router.post('/login/verify-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, otp } = req.body;

    // Verify OTP
    const otpResult = verifyOTP(email, otp);
    if (!otpResult.valid) {
      return res.status(401).json({ message: otpResult.message });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        email: user.email
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ 
      message: 'Server error during OTP verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /login/resend-otp - Resend OTP code
router.post('/login/resend-otp', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  body('pin').isLength({ min: 4, max: 4 }).isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password, pin } = req.body;

    // Verify credentials again
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPinValid = await user.comparePin(pin);
    if (!isPinValid) {
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    // Generate and send new OTP
    const otp = generateOTP();
    storeOTP(email, otp, 10);

    const emailResult = await sendOTPEmail(email, otp);
    if (!emailResult.success) {
      return res.status(500).json({ 
        message: 'Failed to send verification code. Please try again.' 
      });
    }

    res.json({
      message: 'New verification code sent to your email'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ 
      message: 'Server error resending OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /verify - Verify JWT token and return user data (protected route)
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -pin');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

module.exports = router;

