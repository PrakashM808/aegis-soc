const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Generate 2FA secret
const generate2FASecret = (email) => {
  const secret = speakeasy.generateSecret({
    name: `AEGIS-SOC (${email})`,
    issuer: 'AEGIS-SOC',
    length: 32
  });

  return {
    secret: secret.base32,
    qrCode: secret.otpauth_url
  };
};

// Verify 2FA token
const verify2FAToken = (secret, token) => {
  const verified = speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2
  });

  return verified;
};

// Generate QR code
const generateQRCode = async (otpauthUrl) => {
  try {
    const qrCode = await QRCode.toDataURL(otpauthUrl);
    return qrCode;
  } catch (error) {
    console.error('QR code generation error:', error);
    return null;
  }
};

// Generate backup codes
const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
};

module.exports = {
  generate2FASecret,
  verify2FAToken,
  generateQRCode,
  generateBackupCodes
};
