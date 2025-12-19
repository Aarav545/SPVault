// VaultEntry model: stores encrypted password entries for each user
const mongoose = require('mongoose');
const crypto = require('crypto');

// Encryption key derived from JWT_SECRET (in production, use a proper key management system)
const getEncryptionKey = () => {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  return crypto.createHash('sha256').update(secret).digest();
};

// Encrypt password before storing
const encryptPassword = (password) => {
  const algorithm = 'aes-256-cbc';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

// Decrypt password when retrieving
const decryptPassword = (encryptedPassword) => {
  try {
    const algorithm = 'aes-256-cbc';
    const key = getEncryptionKey();
    const parts = encryptedPassword.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt password');
  }
};

// VaultEntry schema: structure for storing password entries
const vaultEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  username: {
    type: String,
    trim: true,
    default: ''
  },
  encryptedPassword: {
    type: String,
    required: [true, 'Password is required']
  },
  url: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook: update updatedAt timestamp
vaultEntrySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual field: decrypt password when accessed (for API responses)
vaultEntrySchema.virtual('password').get(function() {
  return decryptPassword(this.encryptedPassword);
});

// Instance method: set password (encrypts before storing)
vaultEntrySchema.methods.setPassword = function(plainPassword) {
  this.encryptedPassword = encryptPassword(plainPassword);
};

// Static method: encrypt password
vaultEntrySchema.statics.encryptPassword = encryptPassword;

// Static method: decrypt password
vaultEntrySchema.statics.decryptPassword = decryptPassword;

// Ensure virtual fields are included in JSON output
vaultEntrySchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.encryptedPassword;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('VaultEntry', vaultEntrySchema);


