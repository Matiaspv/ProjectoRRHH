import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
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
      <h2>Usuarios</h2>
      {dialog}
      {error && <p role="alert" className="error">{error}</p>}

      <form onSubmit={add} className="card row">
        <input placeholder="Usuario reclutador" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        <input placeholder="Contraseña inicial (12+)" type="password" autoComplete="new-password" value={form.password}
               onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <button>Crear usuario</button>
        <small>El reclutador deberá cambiarla en su primer ingreso.</small>
      </form>

      {draft && (
        <form onSubmit={save} className="card row">
          <input value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} required />
          <input placeholder="Nueva contraseña (opcional)" type="password" autoComplete="new-password" value={draft.password}
                 onChange={(e) => setDraft({ ...draft, password: e.target.value })} />
          <label><span><input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} /> Activo</span></label>
          <button>Guardar cambios</button>
          <button type="button" onClick={() => setDraft(null)}>Cancelar</button>
        </form>
      )}

      <table>
        <thead><tr><th>Usuario</th><th>Rol</th><th>Activo</th><th /></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td><td>{u.role}</td><td>{u.active ? 'Sí' : 'No'}</td>
              <td>
                <button onClick={() => setDraft({ id: u.id, username: u.username, active: u.active, password: '' })}>Modificar</button>
                {u.role !== 'ADMIN' && (
                  <>{' '}<button onClick={() => ask(`Eliminar al usuario ${u.username} requiere autorización del administrador.`, async (pw) => { await deleteUser(s, u.id, pw); refresh(); })}>Eliminar</button></>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Audit />
    </section>
  );
}
