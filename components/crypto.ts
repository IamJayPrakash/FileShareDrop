export async function generateKey() {
  console.log(`[${new Date().toISOString()}] Generating AES-GCM key`);
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
  console.log(`[${new Date().toISOString()}] AES-GCM key generated`);
  return key;
}

export async function exportKey(key: CryptoKey) {
  console.log(`[${new Date().toISOString()}] Exporting key to Base64`);
  const rawKey = await crypto.subtle.exportKey('raw', key);
  const keyB64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
  console.log(
    `[${new Date().toISOString()}] Key exported to Base64: ${keyB64.slice(0, 10)}...`
  );
  return keyB64;
}

export async function importKey(keyB64: string) {
  console.log(
    `[${new Date().toISOString()}] Importing key from Base64: ${keyB64.slice(0, 10)}...`
  );
  let decodedKeyB64 = decodeURIComponent(keyB64);
  decodedKeyB64 = decodedKeyB64.padEnd(
    decodedKeyB64.length + ((4 - (decodedKeyB64.length % 4)) % 4),
    '='
  );
  if (!/^[A-Za-z0-9+/=]+$/.test(decodedKeyB64)) {
    throw new Error('Invalid Base64 key format');
  }
  try {
    const rawKey = new Uint8Array(
      atob(decodedKeyB64)
        .split('')
        .map((c) => c.charCodeAt(0))
    );
    const key = await crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
    console.log(`[${new Date().toISOString()}] Key imported`);
    return key;
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Failed to import key:`, err);
    throw new Error(
      'Failed to import encryption key: Invalid or corrupted key'
    );
  }
}

export async function encryptFile(file: File, key: CryptoKey) {
  console.log(
    `[${new Date().toISOString()}] Encrypting file: ${file.name}, size: ${file.size}`
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  console.log(`[${new Date().toISOString()}] Generated IV:`, iv);
  const fileBuffer = await file.arrayBuffer();
  console.log(
    `[${new Date().toISOString()}] File buffer created, size: ${fileBuffer.byteLength}`
  );
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    fileBuffer
  );
  console.log(
    `[${new Date().toISOString()}] File encrypted, size: ${encrypted.byteLength}`
  );
  return { iv, encrypted, encryptedSize: encrypted.byteLength };
}

export async function decryptFile(
  encryptedData: Uint8Array,
  key: CryptoKey,
  iv: Uint8Array
) {
  console.log(
    `[${new Date().toISOString()}] Decrypting data, size: ${encryptedData.length}, IV:`,
    iv
  );
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encryptedData
  );
  console.log(
    `[${new Date().toISOString()}] Data decrypted, size: ${decrypted.byteLength}`
  );
  return new Blob([decrypted]);
}
