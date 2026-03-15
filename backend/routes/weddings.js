const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../db');

// POST /api/weddings - Create a new event
router.post(
    '/',
    [
        body('groomName').trim().notEmpty().withMessage('Person 1 name is required'),
        body('brideName').trim().notEmpty().withMessage('Person 2 name is required'),
        body('location').trim().notEmpty().withMessage('Location is required'),
        body('weddingDate').isDate().withMessage('Valid date is required'),
        body('functionTypeId').optional().isInt({ min: 1 }),
        body('phoneNumber').optional().trim(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { groomName, brideName, location, weddingDate, functionTypeId, phoneNumber } = req.body;
        try {
            const [result] = await pool.execute(
                'INSERT INTO weddings (functionTypeId, groomName, brideName, location, phoneNumber, weddingDate) VALUES (?, ?, ?, ?, ?, ?)',
                [functionTypeId || 1, groomName, brideName, location, phoneNumber || '', weddingDate]
            );
            const [rows] = await pool.execute(
                `SELECT w.*, ft.nameEn as functionNameEn, ft.nameTa as functionNameTa
         FROM weddings w
         LEFT JOIN function_types ft ON w.functionTypeId = ft.id
         WHERE w.id = ?`,
                [result.insertId]
            );
            res.status(201).json(rows[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to create event' });
        }
    }
);

// GET /api/weddings - List all events with optional search
router.get('/', async (req, res) => {
    const { search } = req.query;
    try {
        let query = `SELECT w.*, ft.nameEn as functionNameEn, ft.nameTa as functionNameTa
                 FROM weddings w
                 LEFT JOIN function_types ft ON w.functionTypeId = ft.id`;
        let params = [];
        if (search) {
            query += ' WHERE w.groomName LIKE ? OR w.brideName LIKE ? OR w.location LIKE ? OR ft.nameEn LIKE ?';
            const like = `%${search}%`;
            params = [like, like, like, like];
        }
        query += ' ORDER BY w.createdAt DESC';
        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// GET /api/weddings/:id - Get single event
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT w.*, ft.nameEn as functionNameEn, ft.nameTa as functionNameTa
       FROM weddings w
       LEFT JOIN function_types ft ON w.functionTypeId = ft.id
       WHERE w.id = ?`,
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Event not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});

module.exports = router;
