const express = require('express');
const router = express.Router({ mergeParams: true });
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Helper: generate next receipt number for this event
async function getNextReceiptNumber(weddingId) {
    const [rows] = await pool.execute(
        'SELECT COUNT(*) as cnt FROM gifts WHERE weddingId = ?',
        [weddingId]
    );
    return String(rows[0].cnt + 1).padStart(4, '0');
}

// POST /api/weddings/:id/gifts - Add a gift
router.post(
    '/',
    authMiddleware,
    [
        body('donorName').trim().notEmpty().withMessage('Donor name is required'),
        body('donorPlace').trim().notEmpty().withMessage('Donor place is required'),
        body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
        body('typistId').optional().isInt({ min: 1 }),
        body('denominations').optional().isArray(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { donorName, donorPlace, amount, typistId, denominations } = req.body;
        const weddingId = req.params.id;

        try {
            // Verify event exists
            const [wedding] = await pool.execute('SELECT id FROM weddings WHERE id = ?', [weddingId]);
            if (wedding.length === 0) return res.status(404).json({ error: 'Event not found' });

            const receiptNumber = await getNextReceiptNumber(weddingId);
            const denomJson = denominations ? JSON.stringify(denominations) : null;

            const [result] = await pool.execute(
                'INSERT INTO gifts (weddingId, typistId, donorName, donorPlace, amount, denominations, receiptNumber) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [weddingId, typistId || null, donorName, donorPlace, amount, denomJson, receiptNumber]
            );

            // Fetch the full record with typist info
            const [rows] = await pool.execute(
                `SELECT g.*, t.name as typistName
         FROM gifts g
         LEFT JOIN typists t ON g.typistId = t.id
         WHERE g.id = ?`,
                [result.insertId]
            );

            const gift = rows[0];
            if (gift.denominations && typeof gift.denominations === 'string') {
                gift.denominations = JSON.parse(gift.denominations);
            }

            res.status(201).json(gift);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to add gift' });
        }
    }
);

// GET /api/weddings/:id/gifts - List gifts with total, optional typist filter
router.get('/', authMiddleware, async (req, res) => {
    const weddingId = req.params.id;
    const { typistId } = req.query;

    try {
        let query = `SELECT g.*, t.name as typistName
                 FROM gifts g
                 LEFT JOIN typists t ON g.typistId = t.id
                 WHERE g.weddingId = ?`;
        let params = [weddingId];

        if (typistId) {
            query += ' AND g.typistId = ?';
            params.push(typistId);
        }
        query += ' ORDER BY g.createdAt ASC';

        const [gifts] = await pool.execute(query, params);

        // Parse denominations JSON
        gifts.forEach((g) => {
            if (g.denominations && typeof g.denominations === 'string') {
                g.denominations = JSON.parse(g.denominations);
            }
        });

        // Totals
        let totalQuery = 'SELECT COALESCE(SUM(amount), 0) as totalAmount, COUNT(*) as count FROM gifts WHERE weddingId = ?';
        let totalParams = [weddingId];
        if (typistId) {
            totalQuery += ' AND typistId = ?';
            totalParams.push(typistId);
        }
        const [totals] = await pool.execute(totalQuery, totalParams);

        res.json({
            gifts,
            totalAmount: parseFloat(totals[0].totalAmount),
            count: totals[0].count,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch gifts' });
    }
});

// GET /api/weddings/:id/gifts/:giftId/receipt — Get receipt data
router.get('/:giftId/receipt', authMiddleware, async (req, res) => {
    try {
        const [gifts] = await pool.execute(
            `SELECT g.*, t.name as typistName
       FROM gifts g
       LEFT JOIN typists t ON g.typistId = t.id
       WHERE g.id = ? AND g.weddingId = ?`,
            [req.params.giftId, req.params.id]
        );
        if (gifts.length === 0) return res.status(404).json({ error: 'Gift not found' });

        const gift = gifts[0];
        if (gift.denominations && typeof gift.denominations === 'string') {
            gift.denominations = JSON.parse(gift.denominations);
        }

        // Get event info
        const [events] = await pool.execute(
            `SELECT w.*, ft.nameEn as functionNameEn, ft.nameTa as functionNameTa
       FROM weddings w
       LEFT JOIN function_types ft ON w.functionTypeId = ft.id
       WHERE w.id = ?`,
            [req.params.id]
        );

        // Get settings
        const [settingsRows] = await pool.execute('SELECT settingKey, settingValue FROM settings');
        const settings = {};
        settingsRows.forEach((r) => { settings[r.settingKey] = r.settingValue; });

        res.json({
            gift,
            event: events[0],
            settings,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch receipt data' });
    }
});

// PUT /api/weddings/:id/gifts/:giftId - Update a gift
router.put(
    '/:giftId',
    authMiddleware,
    [
        body('donorName').trim().notEmpty().withMessage('Donor name is required'),
        body('donorPlace').trim().notEmpty().withMessage('Donor place is required'),
        body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
        body('typistId').optional().isInt({ min: 1 }),
        body('denominations').optional().isArray(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { donorName, donorPlace, amount, typistId, denominations } = req.body;
        const { id: weddingId, giftId } = req.params;

        try {
            // Verify gift exists
            const [existingGift] = await pool.execute(
                'SELECT id FROM gifts WHERE id = ? AND weddingId = ?',
                [giftId, weddingId]
            );
            if (existingGift.length === 0) {
                return res.status(404).json({ error: 'Gift not found' });
            }

            const denomJson = denominations ? JSON.stringify(denominations) : null;

            await pool.execute(
                'UPDATE gifts SET donorName = ?, donorPlace = ?, amount = ?, typistId = ?, denominations = ? WHERE id = ? AND weddingId = ?',
                [donorName, donorPlace, amount, typistId || null, denomJson, giftId, weddingId]
            );

            // Fetch updated record with typist info
            const [rows] = await pool.execute(
                `SELECT g.*, t.name as typistName
         FROM gifts g
         LEFT JOIN typists t ON g.typistId = t.id
         WHERE g.id = ?`,
                [giftId]
            );

            const gift = rows[0];
            if (gift.denominations && typeof gift.denominations === 'string') {
                gift.denominations = JSON.parse(gift.denominations);
            }

            res.json(gift);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to update gift' });
        }
    }
);

// DELETE /api/weddings/:id/gifts/:giftId - Delete a gift
router.delete('/:giftId', authMiddleware, async (req, res) => {
    const { id: weddingId, giftId } = req.params;

    try {
        // Verify gift exists
        const [existingGift] = await pool.execute(
            'SELECT id, amount FROM gifts WHERE id = ? AND weddingId = ?',
            [giftId, weddingId]
        );
        if (existingGift.length === 0) {
            return res.status(404).json({ error: 'Gift not found' });
        }

        await pool.execute(
            'DELETE FROM gifts WHERE id = ? AND weddingId = ?',
            [giftId, weddingId]
        );

        res.json({ success: true, message: 'Gift deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete gift' });
    }
});

module.exports = router;
