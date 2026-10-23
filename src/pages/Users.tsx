import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import Icon from '../components/Icon';
import { useAdminConfirm } from '../components/useAdminConfirm';
import type { Session } from '../domain/types';
import Audit from './Audit';
import { createUser, deleteUser, listUsers, updateUser } from '../services/store';

interface Draft { id: string; username: string; active: boolean; password: string }

/** Solo ADMIN: crear, ver, modificar y eliminar usuarios reclutadores. */
export default function Users() {
  const { session } = useAuth();
  const s = session as Session;
  const [users, setUsers] = useState(() => listUsers(s));
  const [form, setForm] = useState({ username: '', password: '' });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const { ask, dialog } = useAdminConfirm(setError);

  const refresh = () => setUsers(listUsers(s));
  const run = async (fn: () => void | Promise<void>) => {
    try { await fn(); setError(''); refresh(); } catch (err) { setError(err instanceof Error ? err.message : 'Error.'); }
  };

  const add = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => { await createUser(s, form.username.trim(), form.password); setForm({ username: '', password: '' }); });
  };

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    void run(async () => {
      await updateUser(s, draft.id, { username: draft.username.trim(), active: draft.active, password: draft.password || undefined });
      setDraft(null);
    });
  };

  return (
    <section>
      <div className="page-head">
        <h2>Usuarios</h2>
        <p>Administra las cuentas de los reclutadores.</p>
      </div>
      {dialog}
      {error && <p role="alert" className="alert error">{error}</p>}

      <form onSubmit={add} className="card" autoComplete="off">
        <h3 className="card-title">Nuevo usuario reclutador</h3>
        <div className="form-grid">
          <label>Usuario
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} maxLength={32} required />
          </label>
          <label>Contraseña inicial
            <input type="password" autoComplete="new-password" value={form.password} maxLength={128}
                   onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </label>
          <button><Icon name="plus" />Crear usuario</button>
        </div>
        <p className="hint">Mínimo 12 caracteres. El reclutador deberá cambiarla en su primer ingreso.</p>
      </form>

      {draft && (
        <form onSubmit={save} className="card" autoComplete="off">
          <h3 className="card-title">Modificar usuario</h3>
          <div className="form-grid">
            <label>Usuario
              <input value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} maxLength={32} required />
            </label>
            <label>Nueva contraseña (opcional)
              <input type="password" autoComplete="new-password" value={draft.password} maxLength={128}
                     onChange={(e) => setDraft({ ...draft, password: e.target.value })} />
            </label>
            <label className="check">
              <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
              Cuenta activa
            </label>
          </div>
          <div className="form-actions">
            <button>Guardar cambios</button>
            <button type="button" className="secondary" onClick={() => setDraft(null)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><div className="person"><span className="avatar" aria-hidden="true">{u.username.slice(0, 1)}</span><strong>{u.username}</strong></div></td>
                <td><span className="badge role">{u.role}</span></td>
                <td><span className={`badge ${u.active ? 'ok' : 'off'}`}>{u.active ? 'Activo' : 'Inactivo'}</span></td>
                <td className="actions">
                  <button type="button" className="secondary sm"
                          onClick={() => setDraft({ id: u.id, username: u.username, active: u.active, password: '' })}>
                    <Icon name="edit" />Modificar
                  </button>
                  {u.role !== 'ADMIN' && (
                    <button type="button" className="danger sm"
                            onClick={() => ask(`Eliminar al usuario ${u.username} requiere autorización del administrador.`, async (pw) => { await deleteUser(s, u.id, pw); refresh(); })}>
                      <Icon name="trash" />Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Audit />
    </section>
  );
}
