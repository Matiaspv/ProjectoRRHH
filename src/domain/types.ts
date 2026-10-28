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

/** Libre = recién creado sin campaña; Vigente = en una campaña; No vigente = salió de una campaña. */
export type ExecutiveStatus = 'Libre' | 'Vigente' | 'No vigente';

/** Los ejecutivos no son usuarios del sistema: solo se registra su información. */
export interface Executive {
  id: string;
  rut: string;
  name: string;
  lastName: string;
  region: string;
  age: number;
  campaignId: string | null; // null = sin campaña
  status: ExecutiveStatus;
  createdAt: string; // fecha de creación "YYYY-MM-DD"
  startDate: string; // fecha de inicio en campaña ('' si aún no ingresa a una)
  endDate: string; // fecha de término ('' mientras no termine su proceso)
  reason: string; // motivo al quitarlo de la campaña ('' si no aplica)
}

/** Campos que se registran desde el formulario de creación. */
export type NewExecutiveInput = Pick<Executive, 'rut' | 'name' | 'lastName' | 'region' | 'age'>;

/** Campos editables de un ejecutivo existente: datos personales, campaña y motivo del cambio. */
export type ExecutiveInput = NewExecutiveInput & Pick<Executive, 'campaignId' | 'reason'>;

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
  campaignId: string | null;
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
