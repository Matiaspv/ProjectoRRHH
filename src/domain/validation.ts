/** OWASP A03 / ASVS V5: validación de entrada con listas permitidas. */

export const isValidUsername = (v: string) => /^[a-zA-Z0-9._-]{3,32}$/.test(v);

export const passwordError = (v: string): string | null => {
  if (v.length < 12) return 'Mínimo 12 caracteres.';
  if (v.length > 128) return 'Máximo 128 caracteres.';
  if (!/[a-z]/.test(v) || !/[A-Z]/.test(v) || !/\d/.test(v)) return 'Debe incluir mayúscula, minúscula y número.';
  return null;
};

export const isValidName = (v: string) => /^[\p{L} .'-]{2,80}$/u.test(v);

export const cleanRut = (v: string) => v.replace(/[.\s]/g, '').toUpperCase();

/** Módulo 11 del RUT chileno. */
export const isValidRut = (input: string): boolean => {
  const rut = cleanRut(input);
  const m = /^(\d{7,8})-([\dK])$/.exec(rut);
  if (!m) return false;
  let sum = 0;
  let mul = 2;
  for (let i = m[1].length - 1; i >= 0; i--) {
    sum += Number(m[1][i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const r = 11 - (sum % 11);
  const dv = r === 11 ? '0' : r === 10 ? 'K' : String(r);
  return dv === m[2];
};

export const isValidCampaign = (v: string) => /^[\p{L}\d .&-]{2,40}$/u.test(v);

export const REGIONES = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso',
  'Metropolitana', "O'Higgins", 'Maule', 'Ñuble', 'Biobío', 'La Araucanía',
  'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes',
] as const;

export const isValidRegion = (v: string) => (REGIONES as readonly string[]).includes(v);

export const isValidAge = (n: number) => Number.isInteger(n) && n >= 18 && n <= 100;

export const isIsoDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));
