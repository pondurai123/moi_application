const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// GET /api/function-types — List active function types
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM function_types WHERE isActive = TRUE ORDER BY id ASC'
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch function types' });
    }
});

// GET /api/function-types/:id — Get single function type
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM function_types WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Function type not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch function type' });
    }
});

// POST /api/function-types — Create function type (admin only)
router.post(
    '/',
    authMiddleware,
    [
        body('nameEn').trim().notEmpty().withMessage('English name is required'),
        body('nameTa').trim().notEmpty().withMessage('Tamil name is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { nameEn, nameTa } = req.body;
        try {
            const [result] = await pool.execute(
                'INSERT INTO function_types (nameEn, nameTa) VALUES (?, ?)',
                [nameEn, nameTa]
            );
            const [rows] = await pool.execute('SELECT * FROM function_types WHERE id = ?', [result.insertId]);
            res.status(201).json(rows[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to create function type' });
        }
    }
);

// PUT /api/function-types/:id — Update function type (admin only)
router.put(
    '/:id',
    authMiddleware,
    [
        body('nameEn').trim().notEmpty().withMessage('English name is required'),
        body('nameTa').trim().notEmpty().withMessage('Tamil name is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { nameEn, nameTa } = req.body;
        try {
            await pool.execute(
                'UPDATE function_types SET nameEn = ?, nameTa = ? WHERE id = ?',
                [nameEn, nameTa, req.params.id]
            );
            const [rows] = await pool.execute('SELECT * FROM function_types WHERE id = ?', [req.params.id]);
            if (rows.length === 0) return res.status(404).json({ error: 'Function type not found' });
            res.json(rows[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to update function type' });
        }
    }
);

// DELETE /api/function-types/:id — Soft delete (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const [result] = await pool.execute(
            'UPDATE function_types SET isActive = FALSE WHERE id = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Function type not found' });
        res.json({ message: 'Function type deactivated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete function type' });
    }
});

module.exports = router;
