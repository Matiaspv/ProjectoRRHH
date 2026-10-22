import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
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
    <main className="login">
      <form onSubmit={submit} className="card" autoComplete="off">
        <h1>{firstRun ? 'Crear administrador inicial' : 'Iniciar sesión'}</h1>
        <label>Usuario
          <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={32} required autoFocus />
        </label>
        <label>Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={128} required
                 autoComplete={firstRun ? 'new-password' : 'current-password'} />
        </label>
        {firstRun && <small>Mínimo 12 caracteres, con mayúscula, minúscula y número.</small>}
        {error && <p role="alert" className="error">{error}</p>}
        <button disabled={busy}>{busy ? 'Procesando…' : firstRun ? 'Crear' : 'Entrar'}</button>
        <small>
          Aviso de privacidad (Ley 21.719): los datos personales se tratan solo para la gestión de RRHH,
          con acceso restringido por rol y registro de auditoría.
        </small>
      </form>
    </main>
  );
}
