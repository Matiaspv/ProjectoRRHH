/** OWASP A02: hash de contraseñas con PBKDF2-SHA256 + sal única (WebCrypto). */
const ITERATIONS = 210_000;

const toHex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
const fromHex = (h: string) => new Uint8Array(h.match(/../g)!.map((x) => parseInt(x, 16)));

export const newSalt = () => toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
export const newId = () => crypto.randomUUID();

export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: ITERATIONS }, key, 256);
  return toHex(bits);
}

/** Comparación en tiempo constante. */
export const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};
