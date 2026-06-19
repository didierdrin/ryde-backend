const crypto = require('crypto');

const HOUR_MS = 60 * 60 * 1000;

function getSecret() {
  const secret = process.env.ADMIN_REFERRAL_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('ADMIN_REFERRAL_SECRET or JWT_SECRET must be configured');
  }
  return secret;
}

function generateCodeForHour(timeWindow) {
  const hmac = crypto.createHmac('sha256', getSecret());
  hmac.update(String(timeWindow));
  const hash = hmac.digest('hex');
  const num = parseInt(hash.substring(0, 8), 16) % 1000000;
  return num.toString().padStart(6, '0');
}

function getCurrentReferralCode() {
  const timeWindow = Math.floor(Date.now() / HOUR_MS);
  const code = generateCodeForHour(timeWindow);
  const expiresAt = new Date((timeWindow + 1) * HOUR_MS);
  const secondsUntilExpiry = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));

  return {
    code,
    expiresAt: expiresAt.toISOString(),
    secondsUntilExpiry,
  };
}

function isValidReferralCode(code) {
  if (!code || typeof code !== 'string') return false;

  const normalized = code.trim();
  const currentWindow = Math.floor(Date.now() / HOUR_MS);

  // Accept current hour and previous hour (clock skew tolerance)
  for (let offset = 0; offset <= 1; offset++) {
    if (normalized === generateCodeForHour(currentWindow - offset)) {
      return true;
    }
  }

  return false;
}

module.exports = { getCurrentReferralCode, isValidReferralCode };
