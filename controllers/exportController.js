const { sendPdfEmail } = require('../services/emailService');

exports.sendExportEmail = async (req, res) => {
  try {
    const { email, filename, reportTitle, pdfBase64 } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: 'PDF data is required' });
    }

    const recipient = email || req.user?.email;
    if (!recipient) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    const title = reportTitle || 'RYDE Export';
    const safeFilename = (filename || 'ryde-export').replace(/[^\w.-]+/g, '-');
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    await sendPdfEmail({
      to: recipient,
      subject: `${title} — RYDE`,
      text: `Your ${title} export from RYDE is attached.\n\nGenerated on ${new Date().toLocaleString()}.`,
      filename: safeFilename,
      pdfBuffer,
    });

    res.json({ message: `Report sent to ${recipient}` });
  } catch (error) {
    console.error('Export email failed:', error);
    res.status(500).json({ error: error.message || 'Failed to send export email' });
  }
};
