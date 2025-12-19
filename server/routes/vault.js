// Vault routes: handles CRUD operations for password entries
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const VaultEntry = require('../models/VaultEntry');
const { authenticateToken } = require('../middleware/auth');

// GET /entries - Get all password entries for authenticated user
router.get('/entries', authenticateToken, async (req, res) => {
  try {
    const entries = await VaultEntry.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });
    
    // Decrypt passwords for response
    const decryptedEntries = entries.map(entry => {
      const entryObj = entry.toObject();
      entryObj.password = VaultEntry.decryptPassword(entry.encryptedPassword);
      // Remove encryptedPassword from response
      delete entryObj.encryptedPassword;
      delete entryObj.__v;
      return entryObj;
    });

    res.json({ entries: decryptedEntries });
  } catch (error) {
    console.error('Get entries error:', error);
    res.status(500).json({ message: 'Server error fetching entries' });
  }
});

// GET /entries/:id - Get single password entry
router.get('/entries/:id', authenticateToken, async (req, res) => {
  try {
    const entry = await VaultEntry.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    const entryObj = entry.toObject();
    entryObj.password = VaultEntry.decryptPassword(entry.encryptedPassword);

    res.json({ entry: entryObj });
  } catch (error) {
    console.error('Get entry error:', error);
    res.status(500).json({ message: 'Server error fetching entry' });
  }
});

// POST /entries - Create new password entry
router.post('/entries', [
  authenticateToken,
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('username').optional().trim(),
  body('url').optional().trim(),
  body('notes').optional().trim(),
  body('category').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, password, username, url, notes, category } = req.body;

    // Create new entry with encrypted password
    const entry = new VaultEntry({
      userId: req.user.userId,
      title,
      username: username || '',
      encryptedPassword: VaultEntry.encryptPassword(password),
      url: url || '',
      notes: notes || '',
      category: category || 'General'
    });

    await entry.save();

    // Return entry with decrypted password
    const entryObj = entry.toObject();
    entryObj.password = password;

    res.status(201).json({
      message: 'Entry created successfully',
      entry: entryObj
    });
  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({ message: 'Server error creating entry' });
  }
});

// PUT /entries/:id - Update password entry
router.put('/entries/:id', [
  authenticateToken,
  body('title').optional().trim().notEmpty(),
  body('password').optional().notEmpty(),
  body('username').optional().trim(),
  body('url').optional().trim(),
  body('notes').optional().trim(),
  body('category').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const entry = await VaultEntry.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    // Update fields
    if (req.body.title) entry.title = req.body.title;
    if (req.body.username !== undefined) entry.username = req.body.username;
    if (req.body.url !== undefined) entry.url = req.body.url;
    if (req.body.notes !== undefined) entry.notes = req.body.notes;
    if (req.body.category !== undefined) entry.category = req.body.category;
    if (req.body.password) {
      entry.encryptedPassword = VaultEntry.encryptPassword(req.body.password);
    }

    entry.updatedAt = Date.now();
    await entry.save();

    // Return updated entry with decrypted password
    const entryObj = entry.toObject();
    entryObj.password = req.body.password 
      ? req.body.password 
      : VaultEntry.decryptPassword(entry.encryptedPassword);

    res.json({
      message: 'Entry updated successfully',
      entry: entryObj
    });
  } catch (error) {
    console.error('Update entry error:', error);
    res.status(500).json({ message: 'Server error updating entry' });
  }
});

// DELETE /entries/:id - Delete password entry
router.delete('/entries/:id', authenticateToken, async (req, res) => {
  try {
    const entry = await VaultEntry.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({ message: 'Server error deleting entry' });
  }
});

// POST /generate - Generate random secure password
router.post('/generate', authenticateToken, (req, res) => {
  try {
    const length = parseInt(req.body.length) || 16;
    const includeUppercase = req.body.includeUppercase !== false;
    const includeLowercase = req.body.includeLowercase !== false;
    const includeNumbers = req.body.includeNumbers !== false;
    const includeSymbols = req.body.includeSymbols !== false;

    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (charset.length === 0) {
      return res.status(400).json({ message: 'At least one character type must be enabled' });
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomBytes(1)[0] % charset.length;
      password += charset[randomIndex];
    }

    res.json({ password });
  } catch (error) {
    console.error('Generate password error:', error);
    res.status(500).json({ message: 'Server error generating password' });
  }
});

module.exports = router;

