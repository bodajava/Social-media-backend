import crypto from 'node:crypto';

const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default_secret_key', 'salt', 32);
export const encrypt = ({ value }) => {
    if (!value) return value;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
};

export const decrypt = ({ encryptedValue }) => {
    if (!encryptedValue || !encryptedValue.includes(':')) return encryptedValue;
    const [ivHex, encryptedText] = encryptedValue.split(':');
    const ivBuffer = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
