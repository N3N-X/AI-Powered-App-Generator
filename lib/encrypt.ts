import { createCipheriv, createDecipheriv, randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Derives an encryption key from a password and salt using scrypt
 */
async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
}

/**
 * Get the master encryption key from environment
 * In production, this should be a secure, randomly generated key
 */
function getMasterKey(): string {
  const key = process.env.ENCRYPTION_MASTER_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_MASTER_KEY is not set");
  }
  return key;
}

/**
 * Encrypts sensitive data using AES-256-GCM
 * Returns a base64 encoded string containing: salt:iv:authTag:ciphertext
 */
export async function encrypt(plaintext: string): Promise<string> {
  const masterKey = getMasterKey();
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = await deriveKey(masterKey, salt);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine: salt + iv + authTag + ciphertext
  const combined = Buffer.concat([salt, iv, authTag, encrypted]);

  return combined.toString("base64");
}

/**
 * Decrypts data encrypted with the encrypt function
 * Expects base64 encoded string containing: salt:iv:authTag:ciphertext
 */
export async function decrypt(encryptedData: string): Promise<string> {
  const masterKey = getMasterKey();
  const combined = Buffer.from(encryptedData, "base64");

  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = combined.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const ciphertext = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  const key = await deriveKey(masterKey, salt);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Encrypts an object as JSON
 */
export async function encryptJson<T>(data: T): Promise<string> {
  return encrypt(JSON.stringify(data));
}

/**
 * Decrypts and parses JSON data
 */
export async function decryptJson<T>(encryptedData: string): Promise<T> {
  const decrypted = await decrypt(encryptedData);
  return JSON.parse(decrypted) as T;
}

/**
 * Generates a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

/**
 * Hash sensitive data for comparison (one-way)
 */
export async function hashForComparison(data: string): Promise<string> {
  const salt = process.env.HASH_SALT || "rux-default-salt";
  const key = (await scryptAsync(data, salt, 32)) as Buffer;
  return key.toString("hex");
}

/**
 * Masks sensitive data for display (e.g., API keys)
 * Shows first 4 and last 4 characters
 */
export function maskSensitiveData(data: string): string {
  if (data.length <= 12) {
    return "****" + data.slice(-4);
  }
  return data.slice(0, 4) + "****" + data.slice(-4);
}

/**
 * Validates that an encryption key meets minimum requirements
 */
export function validateEncryptionKey(key: string): boolean {
  // Minimum 32 characters for AES-256
  return key.length >= 32;
}
