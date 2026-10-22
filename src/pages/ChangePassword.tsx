import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';

/** Regla 4: pantalla obligatoria en el primer ingreso de un reclutador creado por el admin. */
export default function ChangePassword() {
  const { changePassword, logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    setBusy(true);
    try {
      await changePassword(current, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login">
      <form onSubmit={submit} className="card" autoComplete="off">
        <h1>Cambiar contraseña</h1>
        <small>Por seguridad debe reemplazar la contraseña inicial antes de continuar.</small>
        <label>Contraseña actual
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} maxLength={128} required autoComplete="current-password" />
        </label>
        <label>Nueva contraseña
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} maxLength={128} required autoComplete="new-password" />
        </label>
        <label>Repetir nueva contraseña
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} maxLength={128} required autoComplete="new-password" />
        </label>
        <small>Mínimo 12 caracteres, con mayúscula, minúscula y número.</small>
        {error && <p role="alert" className="error">{error}</p>}
        <button disabled={busy}>Cambiar contraseña</button>
        <button type="button" onClick={logout}>Salir</button>
      </form>
    </main>
  );
}
