import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import ExecutiveForm from '../components/ExecutiveForm';
import ExecutiveTable from '../components/ExecutiveTable';
import type { Session } from '../domain/types';
import { createExecutive, listCampaigns, listExecutives } from '../services/store';

/** Ingreso de ejecutivo (todos los roles). Con `showList` (admin) agrega la lista completa. */
export default function Executives({ showList }: { showList: boolean }) {
  const { session } = useAuth();
  const s = session as Session;
  const [rows, setRows] = useState(() => listExecutives(s));
  const [campaigns] = useState(() => listCampaigns(s));
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const refresh = () => setRows(listExecutives(s));

  return (
    <section>
      <h2>Ingresar ejecutivo</h2>
      {error && <p role="alert" className="error">{error}</p>}
      {ok && <p role="status">{ok}</p>}
      <ExecutiveForm
        campaigns={campaigns}
        submitLabel="Agregar"
        onSubmit={(data) => {
          try { createExecutive(s, data); setError(''); setOk('Ejecutivo ingresado.'); refresh(); }
          catch (e) { setOk(''); setError(e instanceof Error ? e.message : 'Error.'); }
        }}
      />
      {showList && (
        <>
          <h2>Lista de ejecutivos</h2>
          <ExecutiveTable rows={rows} campaigns={campaigns} onChange={refresh} />
        </>
      )}
    </section>
  );
}
