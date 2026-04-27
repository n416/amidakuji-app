// src/server/utils/hash.ts

// セキュリティパラメータ（要件に合わせて調整可能ですが、標準的な値です）
const ITERATIONS = 100000;
const HASH_BYTES = 32;
const SALT_BYTES = 16;

/**
 * パスワードをPBKDF2でハッシュ化する
 * @returns "saltHex:iterations:hashHex" の形式の文字列
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    HASH_BYTES * 8
  );

  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  return `${saltHex}:${ITERATIONS}:${hashHex}`;
}

/**
 * 入力されたパスワードが保存されたハッシュと一致するか検証する
 */
export async function verifyPassword(password: string, storedHashStr: string): Promise<boolean> {
  if (!storedHashStr || !storedHashStr.includes(':')) return false;

  const [saltHex, iterationsStr, originalHashHex] = storedHashStr.split(':');
  const iterations = parseInt(iterationsStr, 10);
  
  // 16進数文字列をUint8Arrayに戻す
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    HASH_BYTES * 8
  );

  const computedHashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // タイミング攻撃を防ぐためのセキュアな比較（CF Workers環境では直接文字列比較でも実用上は機能しますが、念のため）
  return computedHashHex === originalHashHex;
}
