import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import ExecutiveTable from '../components/ExecutiveTable';
import { useAdminConfirm } from '../components/useAdminConfirm';
import { can } from '../domain/permissions';
import type { Session } from '../domain/types';
import {
  NONAME_ID, createCampaign, deleteCampaign, listCampaigns, listExecutives, updateCampaign,
} from '../services/store';

/** Campañas y sus ejecutivos. Admin: CRUD de campañas; reclutador: solo consulta. */
export default function Campaigns() {
  const { session } = useAuth();
  const s = session as Session;
  const canWrite = can(s.role, 'campaign:write');
  const [campaigns, setCampaigns] = useState(() => listCampaigns(s));
  const [execs, setExecs] = useState(() => listExecutives(s));
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');

  const { ask, dialog } = useAdminConfirm(setError);
  const refresh = () => { setCampaigns(listCampaigns(s)); setExecs(listExecutives(s)); };
  const run = (fn: () => void) => {
    try { fn(); setError(''); refresh(); } catch (e) { setError(e instanceof Error ? e.message : 'Error.'); }
  };

  const add = (e: FormEvent) => {
    e.preventDefault();
    run(() => { createCampaign(s, { name: newName, active: true }); setNewName(''); });
  };

  return (
    <section>
      <h2>Campañas</h2>
      {dialog}
      {error && <p role="alert" className="error">{error}</p>}

      {canWrite && (
        <form onSubmit={add} className="card row">
          <input placeholder="Nombre de campaña" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={40} required />
          <button>Crear campaña</button>
        </form>
      )}

      {campaigns.map((c) => {
        const rows = execs.filter((e) => e.campaignId === c.id);
        const system = c.id === NONAME_ID;
        return (
          <article key={c.id}>
            <h3>
              {editId === c.id ? (
                <>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={40} />{' '}
                  <button onClick={() => run(() => { updateCampaign(s, c.id, { name: editName, active: c.active }); setEditId(''); })}>Guardar</button>{' '}
                  <button onClick={() => setEditId('')}>Cancelar</button>
                </>
              ) : (
                <>{c.name} <small>({c.active ? 'Activa' : 'Inactiva'} · {rows.length} ejecutivos)</small></>
              )}
              {canWrite && !system && editId !== c.id && (
                <>
                  {' '}
                  <button onClick={() => { setEditId(c.id); setEditName(c.name); }}>Modificar</button>{' '}
                  <button onClick={() => run(() => updateCampaign(s, c.id, { name: c.name, active: !c.active }))}>
                    {c.active ? 'Desactivar' : 'Activar'}
                  </button>{' '}
                  <button onClick={() => ask(`Eliminar la campaña ${c.name} requiere autorización del administrador.`, async (pw) => { await deleteCampaign(s, c.id, pw); refresh(); })}>Eliminar</button>
                </>
              )}
            </h3>
            <ExecutiveTable rows={rows} campaigns={campaigns} onChange={refresh} />
          </article>
        );
      })}
    </section>
  );
}
