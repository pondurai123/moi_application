const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../db');

// POST /api/admin/login
router.post(
    '/login',
    [
        body('username').trim().notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;
        try {
            const [rows] = await pool.execute('SELECT * FROM admin_users WHERE username = ?', [username]);
            if (rows.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const admin = rows[0];
            const isValid = await bcrypt.compare(password, admin.passwordHash);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { id: admin.id, username: admin.username },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            res.json({ token, username: admin.username });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Login failed' });
        }
    }
);

module.exports = router;
