// Main server entry point - sets up Express server, MongoDB connection, middleware, and routes
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const { logRequest } = require('./middleware/monitor');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware configuration - processes requests before they reach routes
app.use(cors()); // Enable CORS to allow frontend to make requests
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(logRequest); // Log all requests/responses with PPI censoring

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spvault';
mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Routes - define API endpoints
app.use('/api/auth', authRoutes); // Mount authentication routes at /api/auth
const vaultRoutes = require('./routes/vault');
app.use('/api/vault', vaultRoutes); // Mount vault routes at /api/vault
app.get('/api/health', (req, res) => { // Health check endpoint
  res.json({ status: 'OK', message: 'SP Vault Server is running' });
});

// Error handling middleware - catches errors from routes
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server listening on specified port
app.listen(PORT, () => {
  console.log(`SP Vault Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

