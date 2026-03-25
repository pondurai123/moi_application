require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const weddingRoutes = require('./routes/weddings');
const giftRoutes = require('./routes/gifts');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const functionRoutes = require('./routes/functions');
const typistRoutes = require('./routes/typists');
const settingsRoutes = require('./routes/settings');
const thermalPrintRoutes = require('./routes/thermal-print');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    exposedHeaders: ['Content-Disposition']
}));
app.use(express.json({ limit: '10mb' })); // larger limit for logo upload
app.use(express.urlencoded({ extended: true }));

// Set UTF-8 charset for all responses
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// Serve uploaded files (logos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public routes
app.use('/api/weddings', weddingRoutes);
app.use('/api/weddings/:id/gifts', giftRoutes);
app.use('/api/weddings/:id/report', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/function-types', functionRoutes);
app.use('/api/events/:id/typists', typistRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/weddings/:id/gifts', thermalPrintRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🎊 Moi Application API running on http://localhost:${PORT}`);
});

module.exports = app;
