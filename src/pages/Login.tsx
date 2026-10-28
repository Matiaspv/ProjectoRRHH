import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import Icon from '../components/Icon';
import { hasUsers } from '../services/store';

export default function Login() {
  const { login, setup } = useAuth();
  const firstRun = !hasUsers();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await (firstRun ? setup : login)(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth">
      <div className="auth-panel">
        <div className="auth-card">
          <div className="brand">
            <span className="brand-mark"><Icon name="briefcase" /></span>
            Gestión RRHH
          </div>
          <div>
            <h1>{firstRun ? 'Crea el administrador inicial' : 'Bienvenido de vuelta'}</h1>
            <p className="lead">{firstRun ? 'Será la cuenta con acceso total al sistema.' : 'Ingresa tus credenciales para continuar.'}</p>
          </div>
          <form onSubmit={submit} autoComplete="off">
            <label>Usuario
              <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={32} required autoFocus
                     autoComplete="username" spellCheck={false} />
            </label>
            <label>Contraseña
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={128} required
                     autoComplete={firstRun ? 'new-password' : 'current-password'} />
            </label>
            {firstRun && <p className="hint">Mínimo 12 caracteres, con mayúscula, minúscula y número.</p>}
            {error && <p role="alert" className="alert error">{error}</p>}
            <button className="block" disabled={busy}>{busy ? 'Procesando…' : firstRun ? 'Crear administrador' : 'Entrar'}</button>
          </form>
          <p className="auth-legal">
            Aviso de privacidad (Ley 21.719): los datos personales se tratan solo para la gestión de RRHH,
            con acceso restringido por rol y registro de auditoría.
          </p>
        </div>
      </div>
    </main>
  );
}
