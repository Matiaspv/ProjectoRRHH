import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import ExecutiveForm from '../components/ExecutiveForm';
import type { Session } from '../domain/types';
import { createExecutive } from '../services/store';

/** Alta de ejecutivo: solo RUT, nombre, apellido, región y edad; queda "Libre" y sin campaña. */
export default function CreateExecutive() {
  const { session } = useAuth();
  const s = session as Session;
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  return (
    <section>
      <div className="page-head">
        <h2>Crear ejecutivo</h2>
        <p>Registra un nuevo ejecutivo. Quedará libre, sin campaña asignada.</p>
      </div>
      {error && <p role="alert" className="alert error">{error}</p>}
      {ok && <p role="status" className="alert ok">{ok}</p>}
      <ExecutiveForm
        campaigns={[]}
        submitLabel="Crear ejecutivo"
        onSubmit={(data) => {
          try { createExecutive(s, data); setError(''); setOk('Ejecutivo creado.'); }
          catch (e) { setOk(''); setError(e instanceof Error ? e.message : 'Error.'); }
        }}
      />
    </section>
  );
}
