const express = require('express');
const router = express.Router({ mergeParams: true });
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const REPORT_FONT_CANDIDATES = [
    '/usr/share/fonts/truetype/freefont/FreeSerif.ttf',
    '/usr/share/fonts/truetype/samyak-fonts/Samyak-Tamil.ttf',
    '/usr/share/fonts/truetype/lohit-tamil/Lohit-Tamil.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
];

function resolveReportFontPath() {
    return REPORT_FONT_CANDIDATES.find((fontPath) => fs.existsSync(fontPath)) || null;
}

async function getEventAndGifts(eventId, typistId) {
    const [events] = await pool.execute(
        `SELECT w.*, ft.nameEn as functionNameEn, ft.nameTa as functionNameTa
     FROM weddings w
     LEFT JOIN function_types ft ON w.functionTypeId = ft.id
     WHERE w.id = ?`,
        [eventId]
    );
    if (events.length === 0) return null;

    let giftQuery = `SELECT g.*, t.name as typistName
                   FROM gifts g
                   LEFT JOIN typists t ON g.typistId = t.id
                   WHERE g.weddingId = ?`;
    const params = [eventId];
    if (typistId) {
        giftQuery += ' AND g.typistId = ?';
        params.push(typistId);
    }
    giftQuery += ' ORDER BY g.createdAt ASC';

    const [gifts] = await pool.execute(giftQuery, params);
    gifts.forEach((g) => {
        if (g.denominations && typeof g.denominations === 'string') {
            g.denominations = JSON.parse(g.denominations);
        }
    });

    let totalQuery = 'SELECT COALESCE(SUM(amount), 0) as totalAmount FROM gifts WHERE weddingId = ?';
    const totalParams = [eventId];
    if (typistId) {
        totalQuery += ' AND typistId = ?';
        totalParams.push(typistId);
    }
    const [totals] = await pool.execute(totalQuery, totalParams);

    return {
        event: events[0],
        gifts,
        totalAmount: parseFloat(totals[0].totalAmount),
    };
}

router.get('/pdf', authMiddleware, async (req, res) => {
    try {
        const data = await getEventAndGifts(req.params.id, req.query.typistId);
        if (!data) return res.status(404).json({ error: 'Event not found' });

        const { event, gifts, totalAmount } = data;
        const reportFontPath = resolveReportFontPath();
        if (!reportFontPath) {
            return res.status(500).json({ error: 'No Unicode report font found on server' });
        }

        const sanitize = (str) => String(str || '').replace(/[^a-z0-9\u0B80-\u0BFF]/gi, '_');
        const safeFunction = sanitize(event.groomName);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `Gift_Report_${safeFunction}_${timestamp}.pdf`;

        const doc = new PDFDocument({
            bufferPages: true,
            margin: 40,
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

        doc.pipe(res);
        doc.registerFont('ReportBody', reportFontPath);
        doc.registerFont('ReportBold', reportFontPath);

        doc.fontSize(24).font('ReportBold').fillColor('#6B21A8').text('Gift Report', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(14).font('ReportBold').fillColor('#1F2937').text(event.groomName || '', { align: 'center' });
        doc.moveDown(0.2);

        doc.fontSize(10).font('ReportBody').fillColor('#4B5563');
        doc.text(`Location: ${event.location || '-'}`, { align: 'center' });
        if (event.phoneNumber) doc.text(`Phone: ${event.phoneNumber}`, { align: 'center' });
        doc.text(`Date: ${new Date(event.weddingDate).toLocaleDateString('en-IN')}`, { align: 'center' });
        if (req.query.typistId && gifts.length > 0) {
            doc.text(`Typist: ${gifts[0].typistName || 'Unknown'}`, { align: 'center' });
        }

        doc.moveDown(0.5);
        doc.strokeColor('#6B21A8').lineWidth(2).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const col1 = 45;
        const col2 = 90;
        const col3 = 200;
        const col4 = 380;
        const col5 = 520;
        const rowHeight = 18;

        doc.rect(40, tableTop, 515, rowHeight).fill('#6B21A8');
        doc.fontSize(10).font('ReportBold').fillColor('#FFFFFF');
        doc.text('#', col1, tableTop + 3);
        doc.text('Receipt', col2, tableTop + 3);
        doc.text('Donor Name', col3, tableTop + 3);
        doc.text('Place', col4, tableTop + 3);
        doc.text('Amount (₹)', col5 - 40, tableTop + 3, { align: 'right' });

        let y = tableTop + rowHeight;
        gifts.forEach((gift, idx) => {
            const bgColor = idx % 2 === 0 ? '#F9FAFB' : '#FFFFFF';
            doc.rect(40, y, 515, rowHeight).fill(bgColor);
            doc.font('ReportBody').fontSize(9).fillColor('#1F2937');
            doc.text(String(idx + 1), col1, y + 3);
            doc.text(gift.receiptNumber || '-', col2, y + 3);
            doc.text(String(gift.donorName || '-').substring(0, 25), col3, y + 3, { width: 150 });
            doc.text(String(gift.donorPlace || '-').substring(0, 20), col4, y + 3, { width: 120 });
            doc.text(`₹${parseFloat(gift.amount).toLocaleString('en-IN')}`, col5 - 40, y + 3, { align: 'right' });
            y += rowHeight;
        });

        doc.rect(40, y, 515, rowHeight).fill('#EDE9FE');
        doc.font('ReportBold').fontSize(10).fillColor('#6B21A8');
        doc.text('TOTAL', col3, y + 3);
        doc.text(`₹${totalAmount.toLocaleString('en-IN')}`, col5 - 40, y + 3, { align: 'right' });

        doc.moveDown(2);
        doc.fontSize(8).font('ReportBody').fillColor('#9CA3AF');
        doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, { align: 'right' });
        doc.end();
    } catch (err) {
        console.error('PDF generation error:', err);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

router.get('/excel', authMiddleware, async (req, res) => {
    try {
        const data = await getEventAndGifts(req.params.id, req.query.typistId);
        if (!data) return res.status(404).json({ error: 'Event not found' });

        const { event, gifts, totalAmount } = data;
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Moi Application';
        const sheet = workbook.addWorksheet('Gift Report');

        sheet.mergeCells('A1:E1');
        sheet.getCell('A1').value = 'Gift Report';
        sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF6B21A8' } };
        sheet.getCell('A1').alignment = { horizontal: 'center' };

        sheet.mergeCells('A2:E2');
        sheet.getCell('A2').value = event.groomName;
        sheet.getCell('A2').font = { bold: true, size: 13 };
        sheet.getCell('A2').alignment = { horizontal: 'center' };

        sheet.mergeCells('A3:E3');
        let infoLine = `Location: ${event.location} | Date: ${new Date(event.weddingDate).toLocaleDateString('en-IN')}`;
        if (event.phoneNumber) infoLine += ` | Phone: ${event.phoneNumber}`;
        sheet.getCell('A3').value = infoLine;
        sheet.getCell('A3').alignment = { horizontal: 'center' };
        sheet.getCell('A3').font = { size: 11, color: { argb: 'FF4B5563' } };

        sheet.addRow([]);

        const headerRow = sheet.addRow(['#', 'Receipt #', 'Donor Name', 'Place', 'Amount (₹)']);
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B21A8' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' },
            };
        });
        headerRow.height = 22;

        gifts.forEach((gift, idx) => {
            const row = sheet.addRow([
                idx + 1,
                gift.receiptNumber || '-',
                gift.donorName,
                gift.donorPlace,
                parseFloat(gift.amount),
            ]);
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                };
                if (idx % 2 === 0) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
                }
            });
            row.getCell(5).numFmt = '₹#,##0.00';
        });

        const totalRow = sheet.addRow(['', '', '', 'TOTAL', totalAmount]);
        totalRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE9FE' } };
            cell.font = { bold: true, color: { argb: 'FF6B21A8' } };
            cell.border = {
                top: { style: 'medium' }, left: { style: 'thin' },
                bottom: { style: 'medium' }, right: { style: 'thin' },
            };
        });
        totalRow.getCell(5).numFmt = '₹#,##0.00';

        sheet.getColumn(1).width = 6;
        sheet.getColumn(2).width = 12;
        sheet.getColumn(3).width = 28;
        sheet.getColumn(4).width = 22;
        sheet.getColumn(5).width = 18;

        const sanitize = (str) => String(str || '').replace(/[^a-z0-9\u0B80-\u0BFF]/gi, '_');
        const safeFunction = sanitize(event.groomName);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `Gift_Report_${safeFunction}_${timestamp}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate Excel' });
    }
});

module.exports = router;
