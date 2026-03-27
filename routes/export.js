const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');

// Export to CSV
router.post('/csv', (req, res) => {
  const { data, filename } = req.body;

  try {
    let csv = '';
    
    // Header
    if (data && data.length > 0) {
      const headers = Object.keys(data[0]);
      csv += headers.join(',') + '\n';
      
      // Rows
      data.forEach(row => {
        const values = headers.map(h => {
          const val = row[h];
          return typeof val === 'string' ? `"${val}"` : val;
        });
        csv += values.join(',') + '\n';
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'export'}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export to JSON
router.post('/json', (req, res) => {
  const { data, filename } = req.body;

  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'export'}.json"`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export to Excel
router.post('/excel', async (req, res) => {
  const { data, filename, sheetName } = req.body;

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName || 'Data');

    if (data && data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);

      data.forEach(row => {
        const values = headers.map(h => row[h]);
        worksheet.addRow(values);
      });

      // Format header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF00D4FF' }
      };
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'export'}.xlsx"`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
