import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import Icon from '../components/Icon';

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
    <main className="auth">
      <div className="auth-panel">
        <div className="brand">
          <span className="brand-mark"><Icon name="briefcase" /></span>
          Gestión RRHH
        </div>
        <div className="auth-card">
          <div>
            <h1>Cambia tu contraseña</h1>
            <p className="lead">Por seguridad debes reemplazar la contraseña inicial antes de continuar.</p>
          </div>
          <form onSubmit={submit} autoComplete="off">
            <label>Contraseña actual
              <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} maxLength={128} required autoComplete="current-password" autoFocus />
            </label>
            <label>Nueva contraseña
              <input type="password" value={next} onChange={(e) => setNext(e.target.value)} maxLength={128} required autoComplete="new-password" />
            </label>
            <label>Repetir nueva contraseña
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} maxLength={128} required autoComplete="new-password" />
            </label>
            <p className="hint">Mínimo 12 caracteres, con mayúscula, minúscula y número.</p>
            {error && <p role="alert" className="alert error">{error}</p>}
            <button className="block" disabled={busy}>{busy ? 'Procesando…' : 'Cambiar contraseña'}</button>
            <button type="button" className="ghost block" onClick={logout}>Salir</button>
          </form>
        </div>
      </div>
    </main>
  );
}
