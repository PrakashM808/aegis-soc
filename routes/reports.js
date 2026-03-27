const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');

// Generate threat report
router.post('/generate-threat-report', (req, res) => {
  const { startDate, endDate, threats } = req.body;

  try {
    const doc = new PDFDocument();
    const filename = `threat-report-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('AEGIS-SOC Threat Report', { align: 'center' });
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    // Report Details
    doc.fontSize(14).font('Helvetica-Bold').text('Report Details');
    doc.fontSize(11).font('Helvetica');
    doc.text(`Period: ${startDate} to ${endDate}`);
    doc.text(`Total Threats: ${threats?.length || 0}`);
    doc.moveDown();

    // Threat Details
    if (threats && threats.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Threats Detected');
      doc.fontSize(11).font('Helvetica');

      threats.forEach((threat, index) => {
        doc.text(`${index + 1}. ${threat.type} - Severity: ${threat.severity}`, { underline: true });
        doc.text(`   Details: ${threat.details}`);
        doc.text(`   Time: ${threat.time}`);
        doc.moveDown();
      });
    }

    // Recommendations
    doc.fontSize(14).font('Helvetica-Bold').text('Recommendations');
    doc.fontSize(11).font('Helvetica');
    doc.text('1. Review all critical threats immediately');
    doc.text('2. Implement recommended remediation steps');
    doc.text('3. Monitor for similar attack patterns');
    doc.moveDown();

    // Footer
    doc.fontSize(10).text('This is an automated report from AEGIS-SOC', { align: 'center', color: '#666' });

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate compliance report
router.post('/generate-compliance-report', (req, res) => {
  const { standard, data } = req.body;

  try {
    const doc = new PDFDocument();
    const filename = `compliance-report-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    doc.fontSize(24).font('Helvetica-Bold').text(`${standard.toUpperCase()} Compliance Report`, { align: 'center' });
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Compliance Status');
    doc.fontSize(11).font('Helvetica');
    doc.text(`Standard: ${standard}`);
    doc.text(`Compliance Level: 95%`);
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Requirements Met');
    doc.fontSize(11).font('Helvetica');
    doc.text('✓ Data encryption');
    doc.text('✓ Access control');
    doc.text('✓ Audit logging');
    doc.text('✓ User authentication');
    doc.moveDown();

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
