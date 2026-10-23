import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import ExecutiveTable from '../components/ExecutiveTable';
import Icon from '../components/Icon';
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
      <div className="page-head">
        <h2>Campañas</h2>
        <p>Ejecutivos agrupados por campaña.</p>
      </div>
      {dialog}
      {error && <p role="alert" className="alert error">{error}</p>}

      {canWrite && (
        <form onSubmit={add} className="card">
          <h3 className="card-title">Nueva campaña</h3>
          <div className="form-grid">
            <label>Nombre de campaña
              <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={40} required />
            </label>
            <button><Icon name="plus" />Crear campaña</button>
          </div>
        </form>
      )}

      {campaigns.map((c) => {
        const rows = execs.filter((e) => e.campaignId === c.id);
        const system = c.id === NONAME_ID;
        const editing = editId === c.id;
        return (
          <article key={c.id} className="campaign">
            <div className="campaign-head">
              {editing ? (
                <div className="inline-edit">
                  <input aria-label="Nombre de campaña" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={40} />
                  <button type="button" className="sm" onClick={() => run(() => { updateCampaign(s, c.id, { name: editName, active: c.active }); setEditId(''); })}>
                    <Icon name="check" />Guardar
                  </button>
                  <button type="button" className="secondary sm" onClick={() => setEditId('')}>Cancelar</button>
                </div>
              ) : (
                <h3>
                  {c.name}
                  <span className={`badge ${c.active ? 'ok' : 'off'}`}>{c.active ? 'Activa' : 'Inactiva'}</span>
                  <small>{rows.length} {rows.length === 1 ? 'ejecutivo' : 'ejecutivos'}</small>
                </h3>
              )}
              {canWrite && !system && !editing && (
                <div className="campaign-actions">
                  <button type="button" className="secondary sm" onClick={() => { setEditId(c.id); setEditName(c.name); }}>
                    <Icon name="edit" />Modificar
                  </button>
                  <button type="button" className="secondary sm" onClick={() => run(() => updateCampaign(s, c.id, { name: c.name, active: !c.active }))}>
                    {c.active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button type="button" className="danger sm"
                          onClick={() => ask(`Eliminar la campaña ${c.name} requiere autorización del administrador.`, async (pw) => { await deleteCampaign(s, c.id, pw); refresh(); })}>
                    <Icon name="trash" />Eliminar
                  </button>
                </div>
              )}
            </div>
            <ExecutiveTable rows={rows} campaigns={campaigns} onChange={refresh} />
          </article>
        );
      })}
    </section>
  );
}
