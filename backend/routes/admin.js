const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

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
                { id: admin.id, username: admin.username, role: admin.role },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            res.json({ token, username: admin.username, role: admin.role });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Login failed' });
        }
    }
);

// GET /api/admin/users - List all admin users (only SUPER_ADMIN can do this)
router.get('/users', authMiddleware, async (req, res) => {
    // Only SUPER_ADMIN can view all users
    if (req.admin.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Only Super Admin can view all users' });
    }

    try {
        const [users] = await pool.execute(
            'SELECT id, username, role, createdAt FROM admin_users ORDER BY createdAt DESC'
        );
        res.json({ users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /api/admin/users - Create new admin user (only SUPER_ADMIN can do this)
router.post(
    '/users',
    authMiddleware,
    [
        body('username').trim().notEmpty().withMessage('Username is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').isIn(['SUPER_ADMIN', 'ADMIN']).withMessage('Invalid role'),
    ],
    async (req, res) => {
        // Only SUPER_ADMIN can create users
        if (req.admin.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Only Super Admin can create users' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password, role } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const [result] = await pool.execute(
                'INSERT INTO admin_users (username, passwordHash, role) VALUES (?, ?, ?)',
                [username, hashedPassword, role]
            );
            res.json({ message: 'User created successfully', userId: result.insertId, username, role });
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Username already exists' });
            }
            console.error(err);
            res.status(500).json({ error: 'Failed to create user' });
        }
    }
);

// PUT /api/admin/users/:userId - Update user (only SUPER_ADMIN can do this)
router.put(
    '/users/:userId',
    authMiddleware,
    [
        body('username').trim().optional().notEmpty().withMessage('Username cannot be empty'),
        body('role').optional().isIn(['SUPER_ADMIN', 'ADMIN']).withMessage('Invalid role'),
    ],
    async (req, res) => {
        // Only SUPER_ADMIN can update users
        if (req.admin.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Only Super Admin can update users' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { userId } = req.params;
        const { username, role } = req.body;

        // Prevent deleting the last super admin
        if (role && role !== 'SUPER_ADMIN') {
            const [admins] = await pool.execute(
                'SELECT COUNT(*) as count FROM admin_users WHERE role = ?',
                ['SUPER_ADMIN']
            );
            if (admins[0].count === 1) {
                const [user] = await pool.execute('SELECT role FROM admin_users WHERE id = ?', [userId]);
                if (user[0] && user[0].role === 'SUPER_ADMIN') {
                    return res.status(400).json({ error: 'Cannot demote the last super admin' });
                }
            }
        }

        try {
            let updateQuery = 'UPDATE admin_users SET ';
            let updateParams = [];

            if (username) {
                updateQuery += 'username = ?, ';
                updateParams.push(username);
            }
            if (role) {
                updateQuery += 'role = ?, ';
                updateParams.push(role);
            }

            updateQuery = updateQuery.slice(0, -2); // Remove trailing comma
            updateQuery += ' WHERE id = ?';
            updateParams.push(userId);

            await pool.execute(updateQuery, updateParams);
            res.json({ message: 'User updated successfully' });
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Username already exists' });
            }
            console.error(err);
            res.status(500).json({ error: 'Failed to update user' });
        }
    }
);

// DELETE /api/admin/users/:userId - Delete user (only SUPER_ADMIN can do this)
router.delete('/users/:userId', authMiddleware, async (req, res) => {
    // Only SUPER_ADMIN can delete users
    if (req.admin.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Only Super Admin can delete users' });
    }

    const { userId } = req.params;

    // Cannot delete self
    if (parseInt(userId) === req.admin.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Prevent deleting the last super admin
    const [user] = await pool.execute('SELECT role FROM admin_users WHERE id = ?', [userId]);
    if (!user[0]) {
        return res.status(404).json({ error: 'User not found' });
    }

    if (user[0].role === 'SUPER_ADMIN') {
        const [admins] = await pool.execute(
            'SELECT COUNT(*) as count FROM admin_users WHERE role = ?',
            ['SUPER_ADMIN']
        );
        if (admins[0].count === 1) {
            return res.status(400).json({ error: 'Cannot delete the last super admin' });
        }
    }

    try {
        await pool.execute('DELETE FROM admin_users WHERE id = ?', [userId]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// PUT /api/admin/users/:userId/password - Change user password (only SUPER_ADMIN can do this)
router.put(
    '/users/:userId/password',
    authMiddleware,
    [
        body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    ],
    async (req, res) => {
        // Only SUPER_ADMIN can change passwords
        if (req.admin.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Only Super Admin can change passwords' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { userId } = req.params;
        const { newPassword } = req.body;

        try {
            const [user] = await pool.execute('SELECT id FROM admin_users WHERE id = ?', [userId]);
            if (!user[0]) {
                return res.status(404).json({ error: 'User not found' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await pool.execute('UPDATE admin_users SET passwordHash = ? WHERE id = ?', [
                hashedPassword,
                userId,
            ]);

            res.json({ message: 'Password updated successfully' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to update password' });
        }
    }
);

module.exports = router;
