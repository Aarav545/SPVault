// User data model: defines user schema with email, password, PIN, and authentication methods
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema definition: structure and validation rules for user documents
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  pin: {
    type: String,
    required: [true, 'PIN is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

// Pre-save hook: automatically hash password before saving to database
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save hook - automatically hash PIN before saving to database
userSchema.pre('save', async function(next) {
  if (!this.isModified('pin')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.pin = await bcrypt.hash(this.pin, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method - compare plain-text password with stored hash during login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method - compare plain-text PIN with stored hash during login
userSchema.methods.comparePin = async function(candidatePin) {
  return await bcrypt.compare(candidatePin, this.pin);
};

module.exports = mongoose.model('User', userSchema);

