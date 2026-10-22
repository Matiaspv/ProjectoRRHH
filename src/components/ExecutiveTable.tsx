import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { can } from '../domain/permissions';
import type { Campaign, Executive, Session } from '../domain/types';
import { deleteExecutive, exportExecutive, updateExecutive } from '../services/store';
import ExecutiveForm from './ExecutiveForm';
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
  const campaignName = (id: string) => campaigns.find((c) => c.id === id)?.name ?? '—';

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
      {error && <p role="alert" className="error">{error}</p>}
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
      <table>
        <thead>
          <tr>
            <th>RUT</th><th>Nombre</th><th>Región</th><th>Edad</th><th>Campaña</th>
            <th>Fecha inicio</th><th>Vigencia</th><th>Fecha término</th><th>Motivo</th><th />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={10}>Sin ejecutivos.</td></tr>}
          {rows.map((e) => (
            <tr key={e.id}>
              <td>{e.rut}</td><td>{e.name}</td><td>{e.region}</td><td>{e.age}</td>
              <td>{campaignName(e.campaignId)}</td><td>{e.startDate}</td><td>{e.vigencia}</td>
              <td>{e.endDate}</td><td>{e.reason}</td>
              <td>
                <button onClick={() => setEditing(e)}>Modificar</button>{' '}
                <button onClick={() => download(e.id)}>Exportar</button>{' '}
                {canDelete && <button onClick={() => ask(`Eliminar a ${e.name} requiere confirmar su contraseña de administrador.`, async (pw) => { await deleteExecutive(s, e.id, pw); onChange(); })}>Eliminar</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
