import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { can } from '../domain/permissions';
import type { Campaign, Executive, Session } from '../domain/types';
import { deleteExecutive, exportExecutive, updateExecutive } from '../services/store';
import ExecutiveForm from './ExecutiveForm';
import Icon from './Icon';
import { useAdminConfirm } from './useAdminConfirm';

interface Props {
  rows: Executive[];
  campaigns: Campaign[];
  onChange: () => void;
}

/** Lista de ejecutivos con modificar / eliminar / exportar (permisos de reclutador y admin). */
export default function ExecutiveTable({ rows, campaigns, onChange }: Props) {
  const { session } = useAuth();
  const s = session as Session;
  const [editing, setEditing] = useState<Executive | null>(null);
  const [error, setError] = useState('');
  const canDelete = can(s.role, 'executive:delete');
  const { ask, dialog } = useAdminConfirm(setError);
  const campaignName = (id: string | null) => campaigns.find((c) => c.id === id)?.name ?? '—';

  const run = (fn: () => void) => {
    try { fn(); setError(''); onChange(); } catch (e) { setError(e instanceof Error ? e.message : 'Error.'); }
  };

  const download = (id: string) => run(() => {
    const url = URL.createObjectURL(new Blob([exportExecutive(s, id)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'datos-ejecutivo.json'; a.click();
    URL.revokeObjectURL(url);
  });

  return (
    <>
      {dialog}
      {error && <p role="alert" className="alert error">{error}</p>}
      {editing && (
        <ExecutiveForm
          key={editing.id}
          campaigns={campaigns}
          initial={editing}
          submitLabel="Guardar cambios"
          onSubmit={(data) => run(() => { updateExecutive(s, editing.id, data); setEditing(null); })}
          onCancel={() => setEditing(null)}
        />
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>RUT</th><th>Nombre</th><th>Región</th><th className="num">Edad</th><th>Campaña</th>
              <th>Estado</th><th>Creación</th><th><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td className="empty" colSpan={8}>Sin ejecutivos.</td></tr>}
            {rows.map((e) => (
              <tr key={e.id}>
                <td className="mono">{e.rut}</td>
                <td>
                  <div className="person">
                    <span className="avatar" aria-hidden="true">{e.name.slice(0, 1)}</span>
                    <strong>{e.name} {e.lastName}</strong>
                  </div>
                </td>
                <td className="muted">{e.region}</td>
                <td className="num">{e.age}</td>
                <td>{campaignName(e.campaignId)}</td>
                <td><span className={`badge ${e.status === 'Vigente' ? 'ok' : 'off'}`}>{e.status}</span></td>
                <td className="mono">{e.createdAt}</td>
                <td className="actions">
                  <button type="button" className="secondary sm" onClick={() => setEditing(e)}><Icon name="edit" />Modificar</button>
                  <button type="button" className="ghost sm" onClick={() => download(e.id)}><Icon name="download" />Exportar</button>
                  {canDelete && (
                    <button type="button" className="danger sm"
                            onClick={() => ask(`Eliminar a ${e.name} ${e.lastName} requiere confirmar su contraseña de administrador.`, async (pw) => { await deleteExecutive(s, e.id, pw); onChange(); })}>
                      <Icon name="trash" />Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
