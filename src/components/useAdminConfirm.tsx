import { useState, type FormEvent, type ReactNode } from 'react';

interface Pending { message: string; action: (adminPassword: string) => Promise<void> }

/**
 * Regla 5: diálogo que pide la contraseña del administrador antes de una acción destructiva.
 * `ask(mensaje, accion)` abre el diálogo; `dialog` debe renderizarse en el componente.
 */
export function useAdminConfirm(onError: (msg: string) => void): {
  ask: (message: string, action: (adminPassword: string) => Promise<void>) => void;
  dialog: ReactNode;
} {
  const [pending, setPending] = useState<Pending | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => { setPending(null); setPassword(''); setError(''); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pending) return;
    setBusy(true);
    try {
      await pending.action(password);
      close();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error.';
      if (msg.includes('administrador')) setError(msg); // permite reintentar
      else { close(); onError(msg); }
    } finally {
      setBusy(false);
      setPassword('');
    }
  };

  const dialog = pending && (
    <div className="modal" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="card">
        <p>{pending.message}</p>
        <label>Contraseña del administrador
          <input type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={128} required autoFocus />
        </label>
        {error && <p role="alert" className="error">{error}</p>}
        <button disabled={busy}>Confirmar</button>
        <button type="button" onClick={close}>Cancelar</button>
      </form>
    </div>
  );

  return { ask: (message, action) => setPending({ message, action }), dialog };
}
