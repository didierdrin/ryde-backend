const IremboPay = require('@irembo/irembopay-node-sdk').default;

function getEnv() {
  const secret = process.env.IREMBOPAY_SECRET_KEY;
  const env = (process.env.IREMBOPAY_ENVIRONMENT || 'sandbox').toLowerCase();
  const accountId = process.env.IREMBOPAY_ACCOUNT_ID;
  const productId = process.env.IREMBOPAY_PRODUCT_ID;
  return { secret, env, accountId, productId };
}

function assertConfigured() {
  const { secret, accountId, productId } = getEnv();
  if (!secret || !accountId || !productId) {
    const err = new Error(
      'IremboPay is not configured: set IREMBOPAY_SECRET_KEY, IREMBOPAY_ACCOUNT_ID, IREMBOPAY_PRODUCT_ID'
    );
    err.statusCode = 500;
    throw err;
  }
}

function defaultExpiryIso() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

function extractInvoiceNumber(resp) {
  if (!resp) return null;
  if (typeof resp === 'string') return resp;
  return (
    resp.invoiceNumber ??
    resp.invoice_number ??
    resp.data?.invoiceNumber ??
    resp.data?.invoice_number
  );
}

/**
 * @param {object} opts
 * @param {number} opts.amount - RWF amount (rounded)
 * @param {string} [opts.customerName]
 * @param {string} [opts.customerEmail]
 * @param {string} [opts.customerPhone]
 * @param {string} [opts.description]
 * @param {string} [opts.transactionId] - unique id for Irembo (string per SDK README)
 */
async function createInvoicePayload(opts) {
  assertConfigured();
  const { secret, env, accountId, productId } = getEnv();
  const sdkEnv =
    env === 'production' || env === 'prod' ? 'production' : env === 'checkout' ? 'checkout' : 'sandbox';
  const iPay = new IremboPay(secret, sdkEnv);

  const phoneDigits = String(opts.customerPhone || '').replace(/\D/g, '');
  const phoneForApi = phoneDigits.length >= 9 ? phoneDigits : '0780000001';

  const amount = Math.round(Number(opts.amount));
  if (!amount || amount <= 0) {
    const err = new Error('Invalid amount for invoice');
    err.statusCode = 400;
    throw err;
  }

  const payload = {
    transactionId: opts.transactionId || `RYDE-${Date.now()}`,
    paymentAccountIdentifier: accountId,
    customer: {
      email: opts.customerEmail || 'customer@ryde.com',
      phoneNumber: phoneForApi,
      name: opts.customerName || 'Valued Customer',
    },
    paymentItems: [
      {
        unitAmount: amount,
        quantity: 1,
        code: productId,
      },
    ],
    description: opts.description || 'Ryde payment',
    expiryAt: defaultExpiryIso(),
    language: 'EN',
  };

  const response = await iPay.invoice.createInvoice(payload);
  const invoiceNumber = extractInvoiceNumber(response);
  if (!invoiceNumber) {
    console.error('Unexpected IremboPay createInvoice response:', JSON.stringify(response));
    const err = new Error('Could not get invoice number from payment gateway');
    err.statusCode = 502;
    throw err;
  }
  return { invoiceNumber, raw: response };
}

module.exports = {
  assertConfigured,
  getEnv,
  createInvoicePayload,
};
