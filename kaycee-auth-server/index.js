/**
 * index.js - Express Server untuk Railway Deployment
 * Entry point untuk kaycee-auth-server
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (admin.html, etc)
app.use(express.static('public'));

// API Routes
app.use('/api/login', require('./api/login'));
app.use('/api/log', require('./api/log'));
app.use('/api/check_shield', require('./api/check_shield'));
app.use('/api/analyze', require('./api/analyze'));
app.use('/api/version', require('./api/version'));

// Admin Routes
app.use('/api/admin/dashboard', require('./api/admin/dashboard'));
app.use('/api/admin/users', require('./api/admin/users'));
app.use('/api/admin/devices', require('./api/admin/devices'));
app.use('/api/admin/logs', require('./api/admin/logs'));

// Health check
app.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Kaycee Auth Server is running',
        version: '1.0.0'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Kaycee Auth Server running on port ${PORT}`);
    console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin.html`);
});
