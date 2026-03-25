const express = require('express');
const router = express.Router();
const { execFile } = require('child_process');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const thermalPrint = require('./thermal-print');

function execFileAsync(command, args) {
    return new Promise((resolve, reject) => {
        execFile(command, args, (error, stdout, stderr) => {
            if (error) {
                error.stdout = stdout;
                error.stderr = stderr;
                reject(error);
                return;
            }
            resolve({ stdout, stderr });
        });
    });
}

function parseDefaultPrinter(stdout) {
    const match = String(stdout || '').match(/default destination:\s*(.+)$/m);
    return match ? match[1].trim() : '';
}

async function listPrinters() {
    let printers = [];
    let defaultPrinter = '';

    try {
        const { stdout } = await execFileAsync('/usr/bin/lpstat', ['-e']);
        printers = String(stdout || '')
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
    } catch (error) {
        console.warn('[settings] unable to list printers', error.message);
    }

    try {
        const { stdout } = await execFileAsync('/usr/bin/lpstat', ['-d']);
        defaultPrinter = parseDefaultPrinter(stdout);
    } catch (error) {
        console.warn('[settings] unable to read default printer', error.message);
    }

    return { printers, defaultPrinter };
}

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

router.get('/printers', authMiddleware, async (req, res) => {
    try {
        const { printers, defaultPrinter } = await listPrinters();
        res.json({ printers, defaultPrinter });
    } catch (err) {
        console.error('[settings:printers] route error', err);
        res.status(500).json({ error: 'Failed to fetch printers' });
    }
});

router.put(
    '/',
    authMiddleware,
    async (req, res) => {
        const updates = req.body;
        try {
            for (const [key, value] of Object.entries(updates)) {
                await pool.execute(
                    'INSERT INTO settings (settingKey, settingValue) VALUES (?, ?) ON DUPLICATE KEY UPDATE settingValue = ?',
                    [key, value, value]
                );
            }
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

router.post('/logo', authMiddleware, async (req, res) => {
    try {
        const { logoData } = req.body;
        if (!logoData) return res.status(400).json({ error: 'Logo data is required' });

        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

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

router.post('/test-print', authMiddleware, async (req, res) => {
    try {
        const lang = req.body?.lang === 'ta' ? 'ta' : 'en';
        const settings = await thermalPrint.helpers.fetchSettings();
        const requestedPrinterName = typeof req.body?.printerName === 'string' ? req.body.printerName.trim() : '';
        const savedPrinterName = typeof settings.printerName === 'string' ? settings.printerName.trim() : '';
        const printerName = await thermalPrint.helpers.resolvePrinterName(requestedPrinterName || savedPrinterName);

        if (!printerName) {
            return res.status(500).json({ error: 'No printer found on the server. Connect a printer to the server machine or select an available server printer.' });
        }

        const gift = thermalPrint.helpers.buildSampleGift();
        const event = thermalPrint.helpers.buildSampleEvent(lang);
        const result = await thermalPrint.helpers.printReceiptBuffer({ gift, event, settings, printerName, lang });

        res.json({
            success: true,
            message: 'Test receipt printed successfully',
            receiptNumber: result.receiptNumber,
            mode: result.mode,
            printerName,
        });
    } catch (err) {
        console.error('[settings:test-print] route error', err);
        res.status(500).json({ error: 'Failed to print test receipt: ' + err.message });
    }
});

module.exports = router;
