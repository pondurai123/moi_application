const express = require('express');
const router = express.Router({ mergeParams: true });
const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const PDFDocument = require('pdfkit');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const ESC = '\x1B';
const GS = '\x1D';

const CMD = {
    INIT: ESC + '@',
    ALIGN_LEFT: ESC + 'a\x00',
    ALIGN_CENTER: ESC + 'a\x01',
    ALIGN_RIGHT: ESC + 'a\x02',
    BOLD_ON: ESC + 'E\x01',
    BOLD_OFF: ESC + 'E\x00',
    FONT_NORMAL: ESC + 'M\x00',
    FONT_SMALL: ESC + 'M\x01',
    DOUBLE_HEIGHT_ON: ESC + '!\x10',
    DOUBLE_HEIGHT_OFF: ESC + '!\x00',
    LF: '\x0A',
    CUT: GS + 'V\x41\x05',
    UNDERLINE_ON: ESC + '-\x01',
    UNDERLINE_OFF: ESC + '-\x00',
};

const LINE_WIDTH = 32;
const TAMIL_FONT_CANDIDATES = [
    '/usr/share/fonts/truetype/samyak-fonts/Samyak-Tamil.ttf',
    '/usr/share/fonts/truetype/lohit-tamil/Lohit-Tamil.ttf',
    '/usr/share/fonts/truetype/lohit-tamil-classical/Lohit-Tamil-Classical.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSerif.ttf',
];
const LATIN_FONT_CANDIDATES = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSerif.ttf',
];

const tamilToEnglish = {
    'பெயர்': 'Name',
    'ஊர்': 'Place',
    'நாள்': 'Date',
    'ரசீது': 'Receipt',
    'நிகழ்வு': 'Event',
    'இடம்': 'Location',
    'தொலைபேசி': 'Phone',
    'பங்களிப்பாளர் விபரம்': 'Contributor Details',
    'பங்களிப்பு விபரம்': 'Contribution Details',
    'பங்களிப்பு தொகை': 'Contribution Amount',
    'மொத்த பங்களிப்பு': 'Total Contribution',
    'தட்டச்சாளர்': 'Typist',
    'மொய் ரசீது': 'MOI RECEIPT',
};

function transliterate(text) {
    if (!text) return '';
    let result = text;
    Object.keys(tamilToEnglish).forEach((tamil) => {
        result = result.replace(tamil, tamilToEnglish[tamil]);
    });
    return result;
}

function resolveFontPath(fonts) {
    return fonts.find((fontPath) => fs.existsSync(fontPath)) || null;
}

function resolveTamilFontPath() {
    return resolveFontPath(TAMIL_FONT_CANDIDATES);
}

function resolveLatinFontPath() {
    return resolveFontPath(LATIN_FONT_CANDIDATES);
}

function resolveLogoFilePath(logoUrl) {
    if (!logoUrl || typeof logoUrl !== 'string') return null;
    if (!logoUrl.startsWith('/uploads/')) return null;
    const logoPath = path.join(__dirname, '..', logoUrl.replace(/^\/+/, ''));
    return fs.existsSync(logoPath) ? logoPath : null;
}

function hasUnicodeText(value) {
    return /[^\u0000-\u007F]/.test(String(value || ''));
}

function hasTamilText(value) {
    return /[\u0B80-\u0BFF]/.test(String(value || ''));
}

function isTamilChar(char) {
    return /[\u0B80-\u0BFF]/.test(char);
}

function splitScriptRuns(value) {
    const text = String(value || '');
    const runs = [];

    for (const char of text) {
        const fontName = isTamilChar(char) ? 'TamilReceipt' : 'LatinReceipt';
        const lastRun = runs[runs.length - 1];

        if (lastRun && lastRun.fontName === fontName) {
            lastRun.text += char;
        } else {
            runs.push({ fontName, text: char });
        }
    }

    return runs;
}

function shouldUseRasterReceipt(gift, event, settings) {
    const receiptFields = [
        gift?.donorName,
        gift?.donorPlace,
        gift?.typistName,
        event?.groomName,
        event?.brideName,
        event?.location,
        event?.functionNameEn,
        event?.functionNameTa,
        settings?.brandName,
        settings?.brandContact,
        settings?.receiptAdditionalText,
    ];

    return receiptFields.some(hasUnicodeText);
}
function formatReceiptDate(dateInput) {
    const d = new Date(dateInput);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return day + '/' + month + '/' + year + ', ' + hours + ':' + minutes;
}

function parseDefaultPrinter(stdout) {
    const match = String(stdout || '').match(/default destination:\s*(.+)$/m);
    return match ? match[1].trim() : '';
}

function parseFirstAvailablePrinter(stdout) {
    const lines = String(stdout || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    return lines[0] || '';
}

async function resolvePrinterName(requestedPrinterName) {
    if (requestedPrinterName) return requestedPrinterName;

    try {
        const { stdout } = await execFileAsync('/usr/bin/lpstat', ['-d']);
        const defaultPrinter = parseDefaultPrinter(stdout);
        if (defaultPrinter) return defaultPrinter;
    } catch (error) {
        console.warn('[thermal-print] unable to read default printer', error.message);
    }

    try {
        const { stdout } = await execFileAsync('/usr/bin/lpstat', ['-e']);
        const firstPrinter = parseFirstAvailablePrinter(stdout);
        if (firstPrinter) return firstPrinter;
    } catch (error) {
        console.warn('[thermal-print] unable to list printers', error.message);
    }

    return '';
}

function line(char = '-') {
    return char.repeat(LINE_WIDTH) + CMD.LF;
}

function padRight(str, width) {
    const s = String(str || '').substring(0, width);
    return s + ' '.repeat(Math.max(0, width - s.length));
}

function twoCol(left, right, width = LINE_WIDTH) {
    const l = String(left || '');
    const r = String(right || '');
    const space = width - l.length - r.length;
    if (space <= 0) return l.substring(0, width - r.length) + r + CMD.LF;
    return l + ' '.repeat(space) + r + CMD.LF;
}

function center(str, width = LINE_WIDTH) {
    const s = String(str || '').substring(0, width);
    const pad = Math.max(0, Math.floor((width - s.length) / 2));
    return ' '.repeat(pad) + s + CMD.LF;
}
function getReceiptLabels(lang, settings) {
    return lang === 'ta' ? {
        title: 'மொய் ரசீது',
        date: 'நாள்',
        contributorDetails: 'பங்களிப்பாளர் விபரம்',
        name: 'பெயர்',
        place: 'ஊர்',
        denominationDetails: 'பங்களிப்பு விபரம்',
        denom: '₹',
        qty: 'Qty',
        total: 'Total',
        typist: 'தட்டச்சாளர்',
        thankYou: settings.receiptAdditionalText || 'தங்கள் வருகைக்கு நன்றி',
    } : {
        title: 'MOI RECEIPT',
        date: 'Date',
        contributorDetails: 'CONTRIBUTOR DETAILS',
        name: 'Name',
        place: 'Place',
        denominationDetails: 'DENOMINATION DETAILS',
        denom: 'Denom',
        qty: 'Qty',
        total: 'Total',
        typist: 'Typist',
        thankYou: settings.receiptAdditionalText || 'Thank you for your visit!',
    };
}

function buildEscPosReceipt(gift, event, settings, lang = 'en') {
    const labels = getReceiptLabels(lang, settings);
    const amount = parseFloat(gift.amount);
    const amountStr = 'Rs. ' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2 });

    const dateStr = formatReceiptDate(gift.createdAt);

    let buf = '';
    buf += CMD.INIT;
    buf += CMD.FONT_NORMAL;

    buf += CMD.ALIGN_CENTER;
    buf += CMD.BOLD_ON;
    buf += CMD.DOUBLE_HEIGHT_ON;
    buf += labels.title + CMD.LF;
    buf += CMD.DOUBLE_HEIGHT_OFF;
    buf += CMD.BOLD_OFF;

    if (settings.brandName) {
        buf += CMD.BOLD_ON;
        buf += center(transliterate(settings.brandName));
        buf += CMD.BOLD_OFF;
    }

    buf += CMD.BOLD_ON;
    buf += center(transliterate(event.groomName || ''));
    buf += CMD.BOLD_OFF;
    if (event.location) {
        buf += CMD.FONT_SMALL;
        buf += center(transliterate(event.location));
        buf += CMD.FONT_NORMAL;
    }

    const phone = event.phoneNumber || settings.phone || '';
    if (phone) {
        buf += CMD.FONT_SMALL;
        buf += center(phone);
        buf += CMD.FONT_NORMAL;
    }

    buf += CMD.ALIGN_LEFT;
    buf += line('-');

    buf += CMD.FONT_SMALL;
    buf += twoCol(labels.date + ': ' + dateStr, '#' + gift.receiptNumber, LINE_WIDTH);
    buf += CMD.FONT_NORMAL;
    buf += line('-');

    buf += CMD.ALIGN_CENTER;
    buf += CMD.UNDERLINE_ON;
    buf += CMD.BOLD_ON;
    buf += labels.contributorDetails + CMD.LF;
    buf += CMD.BOLD_OFF;
    buf += CMD.UNDERLINE_OFF;
    buf += CMD.ALIGN_LEFT;

    buf += labels.name + ' : ' + CMD.BOLD_ON + transliterate(gift.donorName || '') + CMD.BOLD_OFF + CMD.LF;
    buf += labels.place + ' : ' + transliterate(gift.donorPlace || '') + CMD.LF;

    buf += line('-');

    if (gift.denominations && gift.denominations.length > 0) {
        buf += CMD.ALIGN_CENTER;
        buf += CMD.UNDERLINE_ON;
        buf += labels.denominationDetails + CMD.LF;
        buf += CMD.UNDERLINE_OFF;
        buf += CMD.ALIGN_LEFT;

        buf += CMD.FONT_SMALL;
        buf += twoCol(labels.denom, labels.qty + '    ' + labels.total, LINE_WIDTH);
        buf += line('.');

        gift.denominations.forEach((d) => {
            const total = 'Rs. ' + (d.denomination * d.quantity).toLocaleString('en-IN');
            const row = padRight('Rs. ' + d.denomination, 8) + padRight('x' + d.quantity, 8) + total;
            buf += row + CMD.LF;
        });

        buf += CMD.FONT_NORMAL;
        buf += line('.');
    }

    buf += CMD.ALIGN_CENTER;
    buf += CMD.BOLD_ON;
    buf += CMD.DOUBLE_HEIGHT_ON;
    buf += amountStr + CMD.LF;
    buf += CMD.DOUBLE_HEIGHT_OFF;
    buf += CMD.BOLD_OFF;

    buf += CMD.ALIGN_LEFT;
    buf += line('=');

    if (gift.typistName) {
        buf += CMD.FONT_SMALL;
        buf += CMD.ALIGN_LEFT;
        buf += labels.typist + ': ' + transliterate(gift.typistName) + CMD.LF;
        buf += CMD.FONT_NORMAL;
    }

    buf += CMD.ALIGN_CENTER;
    const thankYou = transliterate(labels.thankYou);
    buf += CMD.FONT_SMALL;
    buf += center(thankYou);

    if (settings.brandContact) {
        buf += center(transliterate(settings.brandContact));
    }

    buf += CMD.FONT_NORMAL;
    buf += CMD.LF;
    buf += CMD.CUT;

    return buf;
}

function buildPdfReceipt(gift, event, settings, lang = 'en') {
    const labels = getReceiptLabels(lang, settings);
    const logoPath = resolveLogoFilePath(settings.logoUrl);
    const logoHeight = logoPath ? 34 : 0;
    const denominationHeight = gift.denominations && gift.denominations.length > 0 ? gift.denominations.length * 14 + 48 : 0;
    const typistHeight = gift.typistName ? 18 : 0;
    const footerHeight = settings.receiptAdditionalText || settings.brandContact ? 34 : 18;
    const pageWidth = 204;
    const pageHeight = 220 + logoHeight + denominationHeight + typistHeight + footerHeight;
    const tamilFontPath = resolveTamilFontPath();
    const latinFontPath = resolveLatinFontPath();

    if (!tamilFontPath) throw new Error('Tamil font not found on server');
    if (!latinFontPath) throw new Error('Latin font not found on server');

    const amount = parseFloat(gift.amount);
    const amountStr = `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    const dateStr = formatReceiptDate(gift.createdAt);
    const phone = event.phoneNumber || settings.phone || '';
    const filePath = path.join(os.tmpdir(), `moi-receipt-${gift.id}-${Date.now()}.pdf`);

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: [pageWidth, pageHeight],
            margins: { top: 10, bottom: 8, left: 12, right: 12 },
        });
        const stream = fs.createWriteStream(filePath);

        const drawSegmentRuns = (segments, x, y, size) => {
            let cursorX = x;

            segments.forEach((segment) => {
                doc.font(segment.fontName).fontSize(size);
                doc.text(segment.text, cursorX, y, { lineBreak: false });
                cursorX += doc.widthOfString(segment.text);
            });

            return cursorX;
        };

        const drawCentered = (text, size) => {
            const segments = splitScriptRuns(text);
            const textWidth = segments.reduce((sum, segment) => {
                doc.font(segment.fontName).fontSize(size);
                return sum + doc.widthOfString(segment.text);
            }, 0);
            const x = Math.max(12, ((pageWidth - 24) - textWidth) / 2 + 12);
            const y = doc.y;

            drawSegmentRuns(segments, x, y, size);
            doc.y = y + size + 3;
        };

        const drawDivider = () => {
            const y = doc.y + 3;
            doc.strokeColor('#000000').lineWidth(0.8).moveTo(12, y).lineTo(pageWidth - 12, y).stroke();
            doc.moveDown(0.45);
        };

        const drawMixedLine = (label, value, size) => {
            const x = 12;
            const y = doc.y;
            const labelSegments = splitScriptRuns(label);
            const valueSegments = splitScriptRuns(value);
            const valueX = drawSegmentRuns(labelSegments, x, y, size);

            drawSegmentRuns(valueSegments, valueX, y, size);
            doc.y = Math.max(doc.y, y + size + 3);
        };

        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
        doc.on('error', reject);

        doc.pipe(stream);
        doc.registerFont('TamilReceipt', tamilFontPath);
        doc.registerFont('LatinReceipt', latinFontPath);
        doc.font('LatinReceipt');

        if (logoPath) {
            try {
                doc.image(logoPath, (pageWidth - 56) / 2, doc.y, { fit: [56, 24], align: 'center' });
                doc.y += 28;
            } catch (error) {
                console.error('[thermal-print] logo render skipped', error.message);
            }
        }

        drawCentered(labels.title, 14);
        doc.moveDown(0.15);

        if (settings.brandName) drawCentered(settings.brandName, 11);
        if (event.groomName) drawCentered(event.groomName, 12);        if (event.location) drawCentered(event.location, 9);
        if (phone) drawCentered(phone, 9);

        drawDivider();

        const dateY = doc.y;
        const dateValueX = drawSegmentRuns(splitScriptRuns(labels.date + ': '), 12, dateY, 8);
        doc.font('LatinReceipt').fontSize(8);
        doc.text(dateStr, dateValueX, dateY, { width: 118, lineBreak: false });
        doc.text('#' + gift.receiptNumber, 138, dateY, { width: 54, align: 'right' });
        doc.y = Math.max(doc.y, dateY + 10);

        drawDivider();

        drawCentered(labels.contributorDetails, 11);
        doc.moveDown(0.1);
        drawMixedLine(labels.name + ' : ', gift.donorName || '', 10);
        drawMixedLine(labels.place + ' : ', gift.donorPlace || '', 10);

        drawDivider();

        if (gift.denominations && gift.denominations.length > 0) {
            drawCentered(labels.denominationDetails, 10);
            doc.moveDown(0.1);
            doc.font('LatinReceipt').fontSize(8);

            const headerY = doc.y;
            doc.text(labels.denom, 12, headerY, { width: 60 });
            doc.text(labels.qty, 85, headerY, { width: 30, align: 'center' });
            doc.text(labels.total, 118, headerY, { width: 74, align: 'right' });
            doc.y = Math.max(doc.y, headerY + 10);
            doc.moveDown(0.1);

            gift.denominations.forEach((d) => {
                const rowY = doc.y;
                doc.font('LatinReceipt').fontSize(8);
                doc.text(`Rs. ${d.denomination}`, 12, rowY, { width: 60 });
                doc.text(`x ${d.quantity}`, 85, rowY, { width: 30, align: 'center' });
                doc.text(`Rs. ${(d.denomination * d.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 118, rowY, {
                    width: 74,
                    align: 'right',
                });
                doc.y = Math.max(doc.y, rowY + 10);
                doc.moveDown(0.1);
            });

            drawDivider();
        }

        doc.moveDown(0.05);
        doc.font('LatinReceipt').fontSize(16);
        doc.text(amountStr, 12, doc.y, { width: pageWidth - 24, align: 'center' });
        drawDivider();

        if (gift.typistName) {
            drawMixedLine(labels.typist + ': ', gift.typistName, 9);
        }

        drawCentered(labels.thankYou, 9);
        if (settings.brandContact) drawCentered(settings.brandContact, 8);

        doc.end();
    });
}

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

function readToken(buffer, start) {
    let i = start;
    while (i < buffer.length) {
        const ch = buffer[i];
        if (ch === 35) {
            while (i < buffer.length && buffer[i] !== 10) i += 1;
        }
        if (buffer[i] === 9 || buffer[i] === 10 || buffer[i] === 13 || buffer[i] === 32) {
            i += 1;
            continue;
        }
        break;
    }

    let end = i;
    while (end < buffer.length) {
        const ch = buffer[end];
        if (ch === 9 || ch === 10 || ch === 13 || ch === 32) break;
        end += 1;
    }

    return { token: buffer.toString('ascii', i, end), nextIndex: end };
}

function parsePbm(buffer) {
    const magic = readToken(buffer, 0);
    if (magic.token !== 'P4') throw new Error('Unsupported bitmap format from pdftoppm');

    const widthToken = readToken(buffer, magic.nextIndex);
    const heightToken = readToken(buffer, widthToken.nextIndex);
    const width = parseInt(widthToken.token, 10);
    const height = parseInt(heightToken.token, 10);

    let dataStart = heightToken.nextIndex;
    while (dataStart < buffer.length) {
        const ch = buffer[dataStart];
        if (ch === 9 || ch === 10 || ch === 13 || ch === 32) {
            dataStart += 1;
            continue;
        }
        break;
    }

    return { width, height, data: buffer.subarray(dataStart) };
}

function buildRasterEscPosFromPbm(buffer) {
    const { width, height, data } = parsePbm(buffer);
    const widthBytes = Math.ceil(width / 8);
    const expectedBytes = widthBytes * height;

    if (data.length < expectedBytes) {
        throw new Error(`Bitmap data too short: expected ${expectedBytes}, got ${data.length}`);
    }

    const xL = widthBytes & 0xff;
    const xH = (widthBytes >> 8) & 0xff;
    const yL = height & 0xff;
    const yH = (height >> 8) & 0xff;

    const header = Buffer.from([
        0x1b, 0x40,
        0x1b, 0x61, 0x01,
        0x1d, 0x76, 0x30, 0x00,
        xL, xH, yL, yH,
    ]);

    const footer = Buffer.from([
        0x0a,
        0x1d, 0x56, 0x41, 0x05,
    ]);

    return Buffer.concat([header, data.subarray(0, expectedBytes), footer]);
}

async function buildTamilRasterReceipt(gift, event, settings, lang = 'en') {
    const pdfPath = await buildPdfReceipt(gift, event, settings, lang);
    const prefix = pdfPath.replace(/\.pdf$/i, '');
    const pbmPath = `${prefix}.pbm`;

    try {
        await execFileAsync('/usr/bin/pdftoppm', ['-mono', '-r', '203', '-singlefile', pdfPath, prefix]);
        const pbmBuffer = fs.readFileSync(pbmPath);
        return buildRasterEscPosFromPbm(pbmBuffer);
    } finally {
        fs.unlink(pdfPath, () => {});
        fs.unlink(pbmPath, () => {});
    }
}

function buildSampleGift() {
    return {
        id: 'sample',
        receiptNumber: '0001',
        donorName: 'ரவி, Ravi',
        donorPlace: 'மதுரை; Madurai',
        typistName: 'கெவின்',
        amount: 500,
        createdAt: new Date(),
        denominations: [
            { denomination: 500, quantity: 1 },
        ],
    };
}

function buildSampleEvent(lang) {
    return {
        groomName: lang === 'ta' ? 'குரு பிரிந்த நாள் விழா' : 'Guru Pirandha Naal Vizha',
        functionNameEn: 'Birthday',
        functionNameTa: 'பிறந்தநாள்',
        location: 'மதுரை',
        phoneNumber: '8787878767',
    };
}

async function fetchSettings() {
    const [settingsRows] = await pool.execute('SELECT settingKey, settingValue FROM settings');
    const settings = {};
    settingsRows.forEach((r) => { settings[r.settingKey] = r.settingValue; });
    return settings;
}

async function printReceiptBuffer({ gift, event, settings, printerName, lang }) {
    const useRasterMode = lang === 'ta' || shouldUseRasterReceipt(gift, event, settings);

    console.log('[thermal-print] request', {
        giftId: gift.id,
        receiptNumber: gift.receiptNumber,
        printerName,
        useRasterMode,
        donorName: gift.donorName,
        donorPlace: gift.donorPlace,
        logoUrl: settings.logoUrl || null,
    });

    const payload = useRasterMode
        ? await buildTamilRasterReceipt(gift, event, settings, lang)
        : Buffer.from(buildEscPosReceipt(gift, event, settings, lang), 'binary');

    console.log(useRasterMode ? '[thermal-print] raster mode' : '[thermal-print] escpos mode', {
        receiptNumber: gift.receiptNumber,
        bytes: payload.length,
    });

    return new Promise((resolve, reject) => {
        const child = execFile(
            '/usr/bin/lp',
            ['-d', printerName, '-o', 'raw', '-'],
            { encoding: 'binary' },
            (error, stdout, stderr) => {
                if (error) {
                    console.error('[thermal-print] print error', error.message, stderr);
                    reject(new Error(stderr || error.message));
                    return;
                }

                const result = {
                    receiptNumber: gift.receiptNumber,
                    mode: useRasterMode ? 'raster' : 'escpos',
                    stdout: stdout?.trim(),
                };

                console.log('[thermal-print] printed', result);
                resolve(result);
            }
        );

        child.stdin.write(payload);
        child.stdin.end();
    });
}

router.post('/:giftId/thermal-print', authMiddleware, async (req, res) => {
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

        const [events] = await pool.execute(
            `SELECT w.*, ft.nameEn as functionNameEn, ft.nameTa as functionNameTa
             FROM weddings w
             LEFT JOIN function_types ft ON w.functionTypeId = ft.id
             WHERE w.id = ?`,
            [req.params.id]
        );
        if (events.length === 0) return res.status(404).json({ error: 'Event not found' });

        const settings = await fetchSettings();

        const event = events[0];
        const requestedPrinterName = typeof req.body?.printerName === 'string' ? req.body.printerName.trim() : '';
        const savedPrinterName = typeof settings.printerName === 'string' ? settings.printerName.trim() : '';
        const printerName = await resolvePrinterName(requestedPrinterName || savedPrinterName);
        const lang = req.body?.lang === 'ta' ? 'ta' : 'en';

        if (!printerName) {
            return res.status(500).json({ error: 'No printer found on the server. Connect a printer to the server machine or select an available server printer.' });
        }

        const result = await printReceiptBuffer({ gift, event, settings, printerName, lang });
        res.json({
            success: true,
            message: 'Printed successfully',
            receiptNumber: result.receiptNumber,
            mode: result.mode,
        });
    } catch (err) {
        console.error('[thermal-print] route error', err);
        res.status(500).json({ error: 'Failed to print: ' + err.message });
    }
});

module.exports = router;
module.exports.helpers = {
    buildSampleEvent,
    buildSampleGift,
    fetchSettings,
    printReceiptBuffer,
    resolvePrinterName,
};
