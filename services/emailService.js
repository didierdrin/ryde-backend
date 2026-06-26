const { Resend } = require('resend');

let resendClient = null;

function getResend() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

/**
 * @param {{ to: string, subject: string, text: string, filename: string, pdfBuffer: Buffer }} opts
 */
async function sendPdfEmail(opts) {
  const resend = getResend();
  if (!resend) {
    throw new Error(
      'Email is not configured on the server. Download the PDF instead, or set RESEND_API_KEY (and RESEND_FROM) on the backend.'
    );
  }

  const from = process.env.RESEND_FROM || 'RYDE <onboarding@resend.dev>';
  const filename = opts.filename.endsWith('.pdf') ? opts.filename : `${opts.filename}.pdf`;

  const { error } = await resend.emails.send({
    from,
    to: [opts.to],
    subject: opts.subject,
    text: opts.text,
    attachments: [
      {
        filename,
        content: opts.pdfBuffer,
      },
    ],
  });

  if (error) {
    throw new Error(error.message || 'Failed to send export email');
  }
}

module.exports = { sendPdfEmail };
