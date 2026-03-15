const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// GET /api/settings — Get all settings
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT settingKey, settingValue FROM settings');
        const settings = {};
        rows.forEach((r) => { settings[r.settingKey] = r.settingValue; });
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// PUT /api/settings — Update settings (admin only)
router.put(
    '/',
    authMiddleware,
    async (req, res) => {
        const updates = req.body; // { key: value, key: value }
        try {
            for (const [key, value] of Object.entries(updates)) {
                await pool.execute(
                    'INSERT INTO settings (settingKey, settingValue) VALUES (?, ?) ON DUPLICATE KEY UPDATE settingValue = ?',
                    [key, value, value]
                );
            }
            // Return updated settings
            const [rows] = await pool.execute('SELECT settingKey, settingValue FROM settings');
            const settings = {};
            rows.forEach((r) => { settings[r.settingKey] = r.settingValue; });
            res.json(settings);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to update settings' });
        }
    }
);

// POST /api/settings/logo — Upload logo (admin only)
router.post('/logo', authMiddleware, async (req, res) => {
    try {
        // For simplicity, accept base64 image data in body
        const { logoData } = req.body; // base64 string
        if (!logoData) return res.status(400).json({ error: 'Logo data is required' });

        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        // Extract format and save
        const matches = logoData.match(/^data:image\/(png|jpg|jpeg|gif);base64,(.+)$/);
        if (!matches) return res.status(400).json({ error: 'Invalid image format' });

        const ext = matches[1];
        const data = matches[2];
        const filename = `logo.${ext}`;
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, data, 'base64');

        const logoUrl = `/uploads/${filename}`;
        await pool.execute(
            'INSERT INTO settings (settingKey, settingValue) VALUES (?, ?) ON DUPLICATE KEY UPDATE settingValue = ?',
            ['logoUrl', logoUrl, logoUrl]
        );

        res.json({ logoUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to upload logo' });
    }
});

module.exports = router;
