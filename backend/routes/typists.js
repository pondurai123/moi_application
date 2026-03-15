const express = require('express');
const router = express.Router({ mergeParams: true });
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// POST /api/events/:id/typists — Add typist to event
router.post(
    '/',
    [
        body('name').trim().notEmpty().withMessage('Typist name is required'),
        body('code').optional().trim(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const eventId = req.params.id;
        const { name, code } = req.body;
        try {
            // Verify event exists
            const [event] = await pool.execute('SELECT id FROM weddings WHERE id = ?', [eventId]);
            if (event.length === 0) return res.status(404).json({ error: 'Event not found' });

            const [result] = await pool.execute(
                'INSERT INTO typists (eventId, name, code) VALUES (?, ?, ?)',
                [eventId, name, code || null]
            );
            const [rows] = await pool.execute('SELECT * FROM typists WHERE id = ?', [result.insertId]);
            res.status(201).json(rows[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to add typist' });
        }
    }
);

// GET /api/events/:id/typists — List typists for event
router.get('/', async (req, res) => {
    const eventId = req.params.id;
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM typists WHERE eventId = ? ORDER BY createdAt ASC',
            [eventId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch typists' });
    }
});

// DELETE /api/events/:id/typists/:tid — Remove typist (admin only)
router.delete('/:tid', authMiddleware, async (req, res) => {
    try {
        const [result] = await pool.execute(
            'DELETE FROM typists WHERE id = ? AND eventId = ?',
            [req.params.tid, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Typist not found' });
        res.json({ message: 'Typist removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to remove typist' });
    }
});

module.exports = router;
