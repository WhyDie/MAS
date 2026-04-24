import crypto from 'crypto';
import { config } from '../config/config';

const algorithm = 'aes-256-cbc';
const key = Buffer.from(config.encryption.key.padEnd(32, '0').substring(0, 32));

export function encryptData(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptData(encrypted: string): string {
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  
  let decrypted = decipher.update(parts[1], 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  
  return decrypted;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  
  return salt + ':' + hash;
}

export function verifyPassword(password: string, hash: string): boolean {
  const parts = hash.split(':');
  const salt = parts[0];
  const originalHash = parts[1];
  
  const newHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  
  return newHash === originalHash;
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
