const axios = require('axios');

function getResendApiKey() {
  return (process.env.RESEND_API_KEY || '').trim();
}

function getFromAddress() {
  const raw = (process.env.RESEND_FROM || 'onboarding@resend.dev').trim();
  if (!raw) return 'RYDE <onboarding@resend.dev>';
  if (raw.includes('<') && raw.includes('>')) return raw;
  if (raw.includes('@')) return `RYDE <${raw}>`;
  return `RYDE <${raw}>`;
}

function isEmailConfigured() {
  return Boolean(getResendApiKey());
}

/**
 * @param {{ to: string, subject: string, text: string, filename: string, pdfBuffer: Buffer }} opts
 */
async function sendPdfEmail(opts) {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    throw new Error(
      'Email is not configured on the server. Set RESEND_API_KEY on the backend (Render → Environment), then redeploy.'
    );
  }

  const from = getFromAddress();
  const filename = opts.filename.endsWith('.pdf') ? opts.filename : `${opts.filename}.pdf`;

  try {
    await axios.post(
      'https://api.resend.com/emails',
      {
        from,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
        attachments: [
          {
            filename,
            content: opts.pdfBuffer.toString('base64'),
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );
  } catch (err) {
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      'Failed to send export email';
    throw new Error(message);
  }
}

module.exports = { sendPdfEmail, isEmailConfigured };
