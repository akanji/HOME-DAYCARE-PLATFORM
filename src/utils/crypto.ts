/**
 * Enterprise AES-256-GCM Cryptographic Implementation
 * Uses Web Crypto API (SubtleCrypto) with PBKDF2 key derivation
 */

// Generate a random 96-bit Initialization Vector (IV)
export function generateIV(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(12));
}

// Convert string to buffer
function str2buf(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert buffer to hex string
export function buf2hex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert hex string to buffer
export function hex2buf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Derive a 256-bit AES-GCM key using PBKDF2
export async function deriveKey(masterPassword = "DAYCARE_PLATFORM_MASTER_AES256_SALT_KEY", saltStr = "coppa_licensed_salt_2026"): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(masterPassword),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(saltStr),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt plaintext string into AES-256-GCM hex payload with prepended IV
export async function encryptAES256(plaintext: string, customKey?: CryptoKey): Promise<{ ciphertextHex: string; ivHex: string; originalSize: number }> {
  try {
    const key = customKey || (await deriveKey());
    const iv = generateIV();
    const encoded = str2buf(plaintext);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encoded
    );

    return {
      ciphertextHex: buf2hex(ciphertextBuffer),
      ivHex: buf2hex(iv),
      originalSize: encoded.byteLength,
    };
  } catch (error) {
    console.error("AES-256 Encryption error:", error);
    throw error;
  }
}

// Decrypt AES-256-GCM hex payload
export async function decryptAES256(ciphertextHex: string, ivHex: string, customKey?: CryptoKey): Promise<string> {
  try {
    const key = customKey || (await deriveKey());
    const iv = hex2buf(ivHex);
    const ciphertext = hex2buf(ciphertextHex);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error("AES-256 Decryption error:", error);
    return "[Decryption failed: Key mismatch or tampered ciphertext]";
  }
}

// Generate quick cryptographic SHA-256 hash for audit logs
export async function computeSHA256(input: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", enc.encode(input));
  return buf2hex(hashBuffer).substring(0, 32);
}

export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", enc.encode(input));
  return buf2hex(hashBuffer);
}

// Convenient serialized wrapper returning string format "ivHex:ciphertextHex"
export async function encryptAES256GCM(plaintext: string, masterPassword?: string): Promise<string> {
  const key = masterPassword ? await deriveKey(masterPassword) : await deriveKey();
  const res = await encryptAES256(plaintext, key);
  return `${res.ivHex}:${res.ciphertextHex}`;
}

export async function decryptAES256GCM(payload: string, masterPassword?: string): Promise<string> {
  const parts = payload.split(':');
  if (parts.length !== 2) throw new Error('Invalid ciphertext format');
  const [ivHex, ciphertextHex] = parts;
  const key = masterPassword ? await deriveKey(masterPassword) : await deriveKey();
  return decryptAES256(ciphertextHex, ivHex, key);
}

