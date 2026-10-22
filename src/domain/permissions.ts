import type { Role } from './types';

export type Action =
  | 'user:list'
  | 'user:create'
  | 'user:update'
  | 'user:delete'
  | 'executive:read'
  | 'executive:write'
  | 'executive:delete'
  | 'campaign:read'
  | 'campaign:write'
  | 'vigencia:read'
  | 'audit:read';

/** El reclutador ingresa y modifica ejecutivos (no los elimina) y solo consulta campañas y vigencia. */
const RECRUITER: Action[] = ['executive:read', 'executive:write', 'campaign:read', 'vigencia:read'];

/** ADMIN = permisos del reclutador + CRUD de usuarios y campañas + auditoría. */
const MATRIX: Record<Role, Action[]> = {
  RECLUTADOR: RECRUITER,
  ADMIN: [
    ...RECRUITER,
    'user:list', 'user:create', 'user:update', 'user:delete',
    'executive:delete', 'campaign:write', 'audit:read',
  ],
};

export const can = (role: Role, action: Action): boolean => MATRIX[role].includes(action);
