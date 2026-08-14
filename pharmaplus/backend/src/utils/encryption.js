const crypto = require('crypto');

// Default fallback key (32 bytes / 256 bits)
const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || 'pharmaplus_aes256_secret_key_2026_safe';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Normaliza la clave para asegurar que tenga exactamente 32 bytes
 */
function getKeyBuffer() {
  return crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
}

/**
 * Encripta un texto plano utilizando AES-256-GCM
 * Retorna formato prefijado: ENC:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
function encrypt(plainText) {
  if (plainText === null || plainText === undefined || plainText === '') {
    return plainText;
  }
  
  const textStr = String(plainText);
  // Si ya está encriptado, no re-encriptar
  if (textStr.startsWith('ENC:')) {
    return textStr;
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getKeyBuffer();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(textStr, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `ENC:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Error encrypting field:', error.message);
    return plainText;
  }
}

/**
 * Desencripta una cadena generada por encrypt()
 */
function decrypt(cipherText) {
  if (!cipherText || typeof cipherText !== 'string' || !cipherText.startsWith('ENC:')) {
    return cipherText;
  }

  try {
    const parts = cipherText.split(':');
    if (parts.length !== 4) {
      return cipherText;
    }

    const iv = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');
    const encryptedText = parts[3];
    const key = getKeyBuffer();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // Si falla la desencriptación (por ej. clave diferente), devolver el valor de forma segura
    return cipherText;
  }
}

/**
 * Enmascara datos sensibles para visualización segura (ej. Tarjetas, RNC, Cédula)
 */
function maskSensitive(value, visibleCount = 4) {
  if (!value) return '';
  const str = String(value);
  if (str.length <= visibleCount) return str;
  return '*'.repeat(str.length - visibleCount) + str.slice(-visibleCount);
}

module.exports = {
  encrypt,
  decrypt,
  maskSensitive
};
