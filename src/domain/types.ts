export type Role = 'ADMIN' | 'RECLUTADOR';

export interface User {
  id: string;
  username: string;
  role: Role;
  salt: string;
  hash: string;
  active: boolean;
  failedAttempts: number;
  lockedUntil: number;
  mustChangePassword: boolean; // true para reclutadores recién creados por el admin
}

export type Vigencia = 'Vigente' | 'No vigente';

/** Los ejecutivos no son usuarios del sistema: solo se registra su información. */
export interface Executive {
  id: string;
  rut: string;
  name: string;
  region: string;
  age: number;
  campaignId: string;
  startDate: string; // fecha inicio "YYYY-MM-DD"
  vigencia: Vigencia;
  endDate: string; // fecha término "YYYY-MM-DD" ('' si sigue vigente)
  reason: string; // motivo del término ('' si sigue vigente)
}

export type ExecutiveInput = Omit<Executive, 'id'>;

export interface Campaign {
  id: string;
  name: string;
  active: boolean;
}

/**
 * Periodo de vigencia de un ejecutivo: inicia cuando pasa a "Vigente" y termina cuando pasa a
 * "No vigente" (endDate '' = periodo abierto). Guarda una copia de los datos del ejecutivo.
 */
export interface VigenciaPeriod {
  id: string;
  executiveId: string;
  rut: string;
  name: string;
  region: string;
  age: number;
  campaignId: string;
  startDate: string;
  endDate: string;
  reason: string; // motivo del término
}

/** Registro de auditoría append-only (ITIL: Change Enablement / OWASP A09). */
export interface AuditEntry {
  ts: number;
  actor: string;
  action: string;
  target: string;
  before?: string; // JSON del estado anterior
  after?: string; // JSON del estado nuevo
}

export interface Session {
  userId: string;
  username: string;
  role: Role;
  mustChangePassword?: boolean;
}
