/**
 * Capa de datos + autorización. Hoy persiste en localStorage; en producción
 * reemplazar por una API (la autorización DEBE reforzarse en el servidor, OWASP A01).
 */
import type {
  AuditEntry, Campaign, Executive, ExecutiveInput, Role, Session, User, VigenciaPeriod,
} from '../domain/types';
import { can, type Action } from '../domain/permissions';
import {
  cleanRut, isIsoDate, isValidAge, isValidCampaign, isValidName, isValidRegion, isValidRut,
  isValidUsername, passwordError,
} from '../domain/validation';
import { hashPassword, newId, newSalt, safeEqual } from './crypto';

const K = {
  users: 'rrhh.users', execs: 'rrhh.execs.v2', campaigns: 'rrhh.campaigns',
  vigencia: 'rrhh.vigencia', audit: 'rrhh.audit',
} as const;
const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60_000;

/** Campaña de sistema que agrupa a los ejecutivos no vigentes. */
export const NONAME_ID = 'camp-noname';

const SEED_CAMPAIGNS: Campaign[] = [
  { id: 'camp-lider-bci', name: 'Lider BCI', active: true },
  { id: 'camp-entel-dental', name: 'Entel Dental', active: true },
  { id: NONAME_ID, name: 'noname', active: false },
];

const read = <T,>(key: string): T[] => {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]; } catch { return []; }
};
const write = (key: string, v: unknown) => localStorage.setItem(key, JSON.stringify(v));

export class ForbiddenError extends Error {}
export class ValidationError extends Error {}

const guard = (s: Session, action: Action) => {
  if (!can(s.role, action)) throw new ForbiddenError('No autorizado.');
  // Regla 4: mientras no cambie su contraseña inicial, el usuario no puede operar.
  if (read<User>(K.users).find((u) => u.id === s.userId)?.mustChangePassword) {
    throw new ForbiddenError('Debe cambiar su contraseña antes de continuar.');
  }
};

/** Regla 3: la auditoría es append-only (sin edición, borrado ni tope de entradas). */
const audit = (actor: string, action: string, target: string, before?: unknown, after?: unknown) => {
  const log = read<AuditEntry>(K.audit);
  const entry: AuditEntry = { ts: Date.now(), actor, action, target };
  if (before !== undefined) entry.before = JSON.stringify(before);
  if (after !== undefined) entry.after = JSON.stringify(after);
  log.push(entry);
  write(K.audit, log);
};

// ---------- Autenticación ----------
export const hasUsers = () => read<User>(K.users).length > 0;

export async function bootstrapAdmin(username: string, password: string): Promise<void> {
  if (hasUsers()) throw new ForbiddenError('El sistema ya fue inicializado.');
  await insertUser(username, password, 'ADMIN', false);
  audit(username, 'bootstrap_admin', username);
}

export async function login(username: string, password: string): Promise<Session> {
  const users = read<User>(K.users);
  const u = users.find((x) => x.username === username);
  const generic = new Error('Usuario o contraseña incorrectos.'); // no revelar cuál falló (A07)
  if (!u) { await hashPassword(password, newSalt()); throw generic; } // igualar tiempos
  if (u.lockedUntil > Date.now()) throw new Error('Cuenta bloqueada temporalmente. Intente más tarde.');
  const ok = safeEqual(await hashPassword(password, u.salt), u.hash) && u.active;
  if (!ok) {
    u.failedAttempts += 1;
    if (u.failedAttempts >= MAX_ATTEMPTS) { u.lockedUntil = Date.now() + LOCK_MS; u.failedAttempts = 0; }
    write(K.users, users);
    audit(username, 'login_failed', username);
    throw generic;
  }
  u.failedAttempts = 0;
  write(K.users, users);
  audit(username, 'login_ok', username);
  return { userId: u.id, username: u.username, role: u.role, mustChangePassword: u.mustChangePassword };
}

/** Regla 4: cambio de contraseña propio (obligatorio en el primer ingreso de un reclutador). */
export async function changeOwnPassword(s: Session, current: string, next: string): Promise<Session> {
  const users = read<User>(K.users);
  const u = users.find((x) => x.id === s.userId);
  if (!u) throw new ForbiddenError('No autorizado.');
  if (!safeEqual(await hashPassword(current, u.salt), u.hash)) {
    audit(u.username, 'password_change_failed', u.username);
    throw new ValidationError('La contraseña actual es incorrecta.');
  }
  const pe = passwordError(next);
  if (pe) throw new ValidationError(pe);
  if (next === current) throw new ValidationError('La nueva contraseña debe ser distinta de la actual.');
  u.salt = newSalt();
  u.hash = await hashPassword(next, u.salt);
  u.mustChangePassword = false;
  write(K.users, users);
  audit(u.username, 'password_change', u.username);
  return { userId: u.id, username: u.username, role: u.role, mustChangePassword: false };
}

/** Regla 5: las acciones destructivas exigen la contraseña del administrador. */
async function confirmAdmin(s: Session, password: string) {
  const admin = read<User>(K.users).find((u) => u.role === 'ADMIN');
  const ok = !!admin && safeEqual(await hashPassword(password, admin.salt), admin.hash);
  if (!ok) {
    audit(s.username, 'admin_confirm_failed', '');
    throw new ValidationError('Contraseña de administrador incorrecta.');
  }
}

// ---------- Usuarios (solo ADMIN; existe un único ADMIN, el resto son RECLUTADOR) ----------
const usernameTaken = (users: User[], username: string, exceptId = '') =>
  users.some((u) => u.id !== exceptId && u.username.toLowerCase() === username.toLowerCase());

async function insertUser(username: string, password: string, role: Role, mustChangePassword: boolean) {
  if (!isValidUsername(username)) throw new ValidationError('Usuario inválido (3-32: letras, números . _ -).');
  const pe = passwordError(password);
  if (pe) throw new ValidationError(pe);
  const users = read<User>(K.users);
  if (usernameTaken(users, username)) throw new ValidationError('El usuario ya existe.');
  const salt = newSalt();
  users.push({
    id: newId(), username, role, salt, hash: await hashPassword(password, salt), active: true,
    failedAttempts: 0, lockedUntil: 0, mustChangePassword,
  });
  write(K.users, users);
}

export const listUsers = (s: Session) => {
  guard(s, 'user:list');
  return read<User>(K.users).map(({ id, username, role, active }) => ({ id, username, role, active }));
};

/** Los usuarios creados desde el sistema son siempre RECLUTADOR y deben cambiar su clave al entrar. */
export async function createUser(s: Session, username: string, password: string) {
  guard(s, 'user:create');
  await insertUser(username, password, 'RECLUTADOR', true);
  audit(s.username, 'user_create', username, undefined, { username, role: 'RECLUTADOR', active: true });
}

export async function updateUser(
  s: Session, id: string, data: { username: string; active: boolean; password?: string },
) {
  guard(s, 'user:update');
  const users = read<User>(K.users);
  const u = users.find((x) => x.id === id);
  if (!u) throw new ValidationError('Usuario no encontrado.');
  if (!isValidUsername(data.username)) throw new ValidationError('Usuario inválido (3-32: letras, números . _ -).');
  if (usernameTaken(users, data.username, id)) throw new ValidationError('El usuario ya existe.');
  if (u.role === 'ADMIN' && !data.active) throw new ValidationError('No se puede desactivar al administrador.');
  const before = { username: u.username, active: u.active };
  if (data.password) {
    const pe = passwordError(data.password);
    if (pe) throw new ValidationError(pe);
    u.salt = newSalt();
    u.hash = await hashPassword(data.password, u.salt);
    u.failedAttempts = 0;
    u.lockedUntil = 0;
  }
  u.username = data.username;
  u.active = data.active;
  write(K.users, users);
  audit(s.username, 'user_update', u.username, before, { username: u.username, active: u.active, passwordChanged: !!data.password });
}

export async function deleteUser(s: Session, id: string, adminPassword: string) {
  guard(s, 'user:delete');
  await confirmAdmin(s, adminPassword);
  const users = read<User>(K.users);
  const u = users.find((x) => x.id === id);
  if (!u) return;
  if (u.role === 'ADMIN') throw new ValidationError('No se puede eliminar al administrador.');
  write(K.users, users.filter((x) => x.id !== id));
  audit(s.username, 'user_delete', u.username, { username: u.username, role: u.role, active: u.active });
}

export const listAudit = (s: Session) => { guard(s, 'audit:read'); return read<AuditEntry>(K.audit).slice().reverse(); };

// ---------- Campañas ----------
/** Siembra las campañas iniciales la primera vez que se leen. */
function readCampaigns(): Campaign[] {
  const list = read<Campaign>(K.campaigns);
  if (list.length === 0) { write(K.campaigns, SEED_CAMPAIGNS); return SEED_CAMPAIGNS.map((c) => ({ ...c })); }
  return list;
}

export const listCampaigns = (s: Session) => { guard(s, 'campaign:read'); return readCampaigns(); };

const campaignNameTaken = (list: Campaign[], name: string, exceptId = '') =>
  list.some((c) => c.id !== exceptId && c.name.toLowerCase() === name.toLowerCase());

export function createCampaign(s: Session, data: { name: string; active: boolean }) {
  guard(s, 'campaign:write');
  const name = data.name.trim();
  if (!isValidCampaign(name)) throw new ValidationError('Nombre de campaña inválido.');
  const list = readCampaigns();
  if (campaignNameTaken(list, name)) throw new ValidationError('La campaña ya existe.');
  const c = { id: newId(), name, active: data.active };
  list.push(c);
  write(K.campaigns, list);
  audit(s.username, 'campaign_create', name, undefined, c);
}

export function updateCampaign(s: Session, id: string, data: { name: string; active: boolean }) {
  guard(s, 'campaign:write');
  const name = data.name.trim();
  if (!isValidCampaign(name)) throw new ValidationError('Nombre de campaña inválido.');
  const list = readCampaigns();
  const c = list.find((x) => x.id === id);
  if (!c) throw new ValidationError('Campaña no encontrada.');
  if (id === NONAME_ID) throw new ValidationError('La campaña "noname" es de sistema y no se puede modificar.');
  if (campaignNameTaken(list, name, id)) throw new ValidationError('La campaña ya existe.');
  if (!data.active && read<Executive>(K.execs).some((e) => e.campaignId === id && e.vigencia === 'Vigente')) {
    throw new ValidationError('No se puede desactivar: tiene ejecutivos vigentes.');
  }
  const before = { ...c };
  c.name = name;
  c.active = data.active;
  write(K.campaigns, list);
  audit(s.username, 'campaign_update', name, before, c);
}

export async function deleteCampaign(s: Session, id: string, adminPassword: string) {
  guard(s, 'campaign:write');
  await confirmAdmin(s, adminPassword);
  const list = readCampaigns();
  const c = list.find((x) => x.id === id);
  if (!c) return;
  if (id === NONAME_ID) throw new ValidationError('La campaña "noname" es de sistema y no se puede eliminar.');
  if (read<Executive>(K.execs).some((e) => e.campaignId === id)) {
    throw new ValidationError('No se puede eliminar: la campaña tiene ejecutivos asociados.');
  }
  write(K.campaigns, list.filter((x) => x.id !== id));
  audit(s.username, 'campaign_delete', c.name, c);
}

// ---------- Ejecutivos (registros; no son usuarios) ----------
export const listExecutives = (s: Session) => { guard(s, 'executive:read'); return read<Executive>(K.execs); };

/**
 * Valida y normaliza. Regla de negocio: un ejecutivo "No vigente" siempre pertenece a la
 * campaña inactiva "noname" y exige fecha de término y motivo (regla 13); uno "Vigente"
 * debe estar en una campaña activa.
 */
function normalizeExecutive(data: ExecutiveInput, list: Executive[], selfId = ''): ExecutiveInput {
  if (!isValidRut(data.rut)) throw new ValidationError('RUT inválido.');
  const rut = cleanRut(data.rut);
  if (list.some((e) => e.id !== selfId && e.rut === rut)) throw new ValidationError('El RUT ya está registrado.');
  if (!isValidName(data.name.trim())) throw new ValidationError('Nombre inválido.');
  if (!isValidRegion(data.region)) throw new ValidationError('Región inválida.');
  if (!isValidAge(data.age)) throw new ValidationError('Edad inválida (18-100).');
  if (!isIsoDate(data.startDate)) throw new ValidationError('Fecha de inicio inválida.');
  if (data.vigencia !== 'Vigente' && data.vigencia !== 'No vigente') throw new ValidationError('Vigencia inválida.');
  if (data.endDate && !isIsoDate(data.endDate)) throw new ValidationError('Fecha de término inválida.');
  if (data.endDate && data.endDate < data.startDate) throw new ValidationError('La fecha de término no puede ser anterior al inicio.');
  const reason = data.reason.trim();
  if (reason.length > 300) throw new ValidationError('Motivo demasiado largo (máx. 300).');

  let campaignId = data.campaignId;
  if (data.vigencia === 'No vigente') {
    if (!data.endDate) throw new ValidationError('Un ejecutivo no vigente requiere fecha de término.');
    if (!reason) throw new ValidationError('El motivo es obligatorio para pasar un ejecutivo a "No vigente".');
    campaignId = NONAME_ID;
  } else {
    const c = readCampaigns().find((x) => x.id === campaignId);
    if (!c || !c.active) throw new ValidationError('Un ejecutivo vigente requiere una campaña activa.');
  }
  return { rut, name: data.name.trim(), region: data.region, age: data.age, campaignId, startDate: data.startDate, vigencia: data.vigencia, endDate: data.endDate, reason };
}

// ---------- Tabla de vigencia (regla 12) ----------
const todayIso = () => new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD en hora local

export const listVigencia = (s: Session) => { guard(s, 'vigencia:read'); return read<VigenciaPeriod>(K.vigencia); };

const snapshot = (e: Executive) => ({
  executiveId: e.id, rut: e.rut, name: e.name, region: e.region, age: e.age, campaignId: e.campaignId,
});

/** Mantiene los periodos de vigencia según la transición de estado del ejecutivo. */
function syncVigencia(prev: Executive | null, next: Executive) {
  const periods = read<VigenciaPeriod>(K.vigencia);
  const open = periods.find((p) => p.executiveId === next.id && !p.endDate);

  if (next.vigencia === 'Vigente') {
    if (open) Object.assign(open, snapshot(next)); // sigue vigente: refresca los datos del periodo abierto
    else periods.push({ id: newId(), ...snapshot(next), startDate: prev ? todayIso() : next.startDate, endDate: '', reason: '' });
  } else if (open) {
    Object.assign(open, { endDate: next.endDate, reason: next.reason }); // pasa a no vigente: cierra el periodo
  } else if (!prev) {
    periods.push({ id: newId(), ...snapshot(next), startDate: next.startDate, endDate: next.endDate, reason: next.reason });
  }
  write(K.vigencia, periods);
}

export function createExecutive(s: Session, data: ExecutiveInput) {
  guard(s, 'executive:write');
  const list = read<Executive>(K.execs);
  const e: Executive = { id: newId(), ...normalizeExecutive(data, list) };
  list.push(e);
  write(K.execs, list);
  syncVigencia(null, e);
  audit(s.username, 'executive_create', e.rut, undefined, e);
}

export function updateExecutive(s: Session, id: string, data: ExecutiveInput) {
  guard(s, 'executive:write');
  const list = read<Executive>(K.execs);
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) throw new ValidationError('Ejecutivo no encontrado.');
  const prev = list[i];
  list[i] = { id, ...normalizeExecutive(data, list, id) };
  write(K.execs, list);
  syncVigencia(prev, list[i]);
  audit(s.username, 'executive_update', list[i].rut, prev, list[i]);
}

/** Ley 21.719: derecho de acceso/portabilidad. */
export const exportExecutive = (s: Session, id: string) => {
  guard(s, 'executive:read');
  const e = read<Executive>(K.execs).find((x) => x.id === id);
  if (!e) throw new ValidationError('Ejecutivo no encontrado.');
  audit(s.username, 'executive_export', e.rut);
  return JSON.stringify(e, null, 2);
};

/** Ley 21.719: derecho de supresión; se elimina el registro y queda traza de auditoría. El historial de vigencia se conserva. */
export const deleteExecutive = async (s: Session, id: string, adminPassword: string) => {
  guard(s, 'executive:delete');
  await confirmAdmin(s, adminPassword);
  const list = read<Executive>(K.execs);
  const e = list.find((x) => x.id === id);
  if (!e) return;
  write(K.execs, list.filter((x) => x.id !== id));
  audit(s.username, 'executive_delete', e.rut, e);
};
