const nodemailer = require('nodemailer');

let transporterPromise = null;

function getTransporter() {
  if (!transporterPromise) {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      return Promise.resolve(null);
    }

    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
      })
    );
  }
  return transporterPromise;
}

/**
 * @param {{ to: string, subject: string, text: string, filename: string, pdfBuffer: Buffer }} opts
 */
async function sendPdfEmail(opts) {
  const transporter = await getTransporter();
  if (!transporter) {
    throw new Error(
      'Email is not configured on the server. Download the PDF instead, or ask your administrator to set SMTP_HOST, SMTP_USER, and SMTP_PASS.'
    );
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from: `RYDE <${from}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    attachments: [
      {
        filename: opts.filename.endsWith('.pdf') ? opts.filename : `${opts.filename}.pdf`,
        content: opts.pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}

module.exports = { sendPdfEmail };
