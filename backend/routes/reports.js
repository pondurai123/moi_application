const express = require('express');
const router = express.Router({ mergeParams: true });
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const pool = require('../db');

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
    let params = [eventId];
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
    let totalParams = [eventId];
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

// GET /api/weddings/:id/report/pdf
router.get('/pdf', async (req, res) => {
    try {
        const data = await getEventAndGifts(req.params.id, req.query.typistId);
        if (!data) return res.status(404).json({ error: 'Event not found' });

        const { event, gifts, totalAmount } = data;
        const doc = new PDFDocument({ margin: 50 });

        const functionName = event.functionNameEn || 'Event';

        const sanitize = (str) => str.replace(/[^a-z0-9\u0B80-\u0BFF]/gi, '_');
        const safeGroom = sanitize(event.groomName);
        const safeBride = sanitize(event.brideName);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `${functionName}_${safeGroom}_${safeBride}_${timestamp}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${encodeURIComponent(filename)}"`
        );
        doc.pipe(res);

        // ---- Header ----
        doc.fontSize(22).fillColor('#6B21A8').text(`${functionName} Gift Report`, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(14).fillColor('#1F2937');
        doc.text(`${event.groomName}  &  ${event.brideName}`, { align: 'center' });
        doc.text(`Location: ${event.location}`, { align: 'center' });
        if (event.phoneNumber) doc.text(`Phone: ${event.phoneNumber}`, { align: 'center' });
        doc.text(`Date: ${new Date(event.weddingDate).toLocaleDateString('en-IN')}`, { align: 'center' });
        if (req.query.typistId) {
            const typistName = gifts.length > 0 ? gifts[0].typistName : `Typist #${req.query.typistId}`;
            doc.text(`Typist: ${typistName}`, { align: 'center' });
        }
        doc.moveDown(1);

        // ---- Table Header ----
        const tableTop = doc.y;
        const colWidths = [30, 50, 140, 120, 100];
        const colX = [50, 85, 140, 285, 410];
        const rowHeight = 25;

        const drawRow = (y, values, isHeader = false) => {
            if (isHeader) {
                doc.rect(50, y, 490, rowHeight).fill('#6B21A8');
                doc.fillColor('#FFFFFF').fontSize(10);
            } else {
                doc.rect(50, y, 490, rowHeight).stroke('#E5E7EB');
                doc.fillColor('#1F2937').fontSize(9);
            }
            values.forEach((val, i) => {
                doc.text(String(val), colX[i] + 4, y + 7, { width: colWidths[i] - 8, lineBreak: false });
            });
        };

        drawRow(tableTop, ['#', 'Receipt', 'Donor Name', 'Place', 'Amount (₹)'], true);

        let y = tableTop + rowHeight;
        gifts.forEach((gift, idx) => {
            if (y > 700) {
                doc.addPage();
                y = 50;
            }
            if (idx % 2 === 0) {
                doc.rect(50, y, 490, rowHeight).fill('#F9FAFB');
                doc.fillColor('#1F2937').fontSize(9);
            }
            drawRow(y, [
                idx + 1,
                gift.receiptNumber || '-',
                gift.donorName,
                gift.donorPlace,
                `₹${parseFloat(gift.amount).toLocaleString('en-IN')}`,
            ]);
            y += rowHeight;
        });

        // ---- Total Row ----
        doc.rect(50, y, 490, rowHeight).fill('#EDE9FE');
        doc.fillColor('#6B21A8').fontSize(11).font('Helvetica-Bold');
        doc.text('TOTAL', colX[0] + 4, y + 7, { width: 330, lineBreak: false });
        doc.text(`₹${totalAmount.toLocaleString('en-IN')}`, colX[4] + 4, y + 7, { width: colWidths[4] - 8, lineBreak: false });

        doc.moveDown(2);
        doc.fontSize(9).fillColor('#9CA3AF').font('Helvetica')
            .text(`Generated on ${new Date().toLocaleString('en-IN')}`, { align: 'right' });

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// GET /api/weddings/:id/report/excel
router.get('/excel', async (req, res) => {
    try {
        const data = await getEventAndGifts(req.params.id, req.query.typistId);
        if (!data) return res.status(404).json({ error: 'Event not found' });

        const { event, gifts, totalAmount } = data;
        const functionName = event.functionNameEn || 'Event';
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Moi Application';
        const sheet = workbook.addWorksheet('Gift Report');

        // ---- Event Info Header ----
        sheet.mergeCells('A1:E1');
        sheet.getCell('A1').value = `${functionName} Gift Report`;
        sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF6B21A8' } };
        sheet.getCell('A1').alignment = { horizontal: 'center' };

        sheet.mergeCells('A2:E2');
        sheet.getCell('A2').value = `${event.groomName} & ${event.brideName}`;
        sheet.getCell('A2').font = { bold: true, size: 13 };
        sheet.getCell('A2').alignment = { horizontal: 'center' };

        sheet.mergeCells('A3:E3');
        let infoLine = `Location: ${event.location} | Date: ${new Date(event.weddingDate).toLocaleDateString('en-IN')}`;
        if (event.phoneNumber) infoLine += ` | Phone: ${event.phoneNumber}`;
        sheet.getCell('A3').value = infoLine;
        sheet.getCell('A3').alignment = { horizontal: 'center' };
        sheet.getCell('A3').font = { size: 11, color: { argb: 'FF4B5563' } };

        sheet.addRow([]);

        // ---- Column Headers ----
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

        // ---- Gift Rows ----
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

        // ---- Total Row ----
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

        // ---- Column Widths ----
        sheet.getColumn(1).width = 6;
        sheet.getColumn(2).width = 12;
        sheet.getColumn(3).width = 28;
        sheet.getColumn(4).width = 22;
        sheet.getColumn(5).width = 18;

        const sanitize = (str) => str.replace(/[^a-z0-9\u0B80-\u0BFF]/gi, '_');
        const safeGroom = sanitize(event.groomName);
        const safeBride = sanitize(event.brideName);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `${functionName}_${safeGroom}_${safeBride}_${timestamp}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${encodeURIComponent(filename)}"`
        );
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate Excel' });
    }
});

module.exports = router;
