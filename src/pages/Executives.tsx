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
      <div className="page-head">
        <h2>Ingresar ejecutivo</h2>
        <p>Registra la información de un nuevo ejecutivo.</p>
      </div>
      {error && <p role="alert" className="alert error">{error}</p>}
      {ok && <p role="status" className="alert ok">{ok}</p>}
      <ExecutiveForm
        campaigns={campaigns}
        submitLabel="Agregar ejecutivo"
        onSubmit={(data) => {
          try { createExecutive(s, data); setError(''); setOk('Ejecutivo ingresado.'); refresh(); }
          catch (e) { setOk(''); setError(e instanceof Error ? e.message : 'Error.'); }
        }}
      />
      {showList && (
        <>
          <div className="page-head">
            <h2>Lista de ejecutivos</h2>
            <p>{rows.length} registrados</p>
          </div>
          <ExecutiveTable rows={rows} campaigns={campaigns} onChange={refresh} />
        </>
      )}
    </section>
  );
}
