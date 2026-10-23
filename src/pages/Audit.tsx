import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { Session } from '../domain/types';
import Icon from '../components/Icon';
import { listAudit } from '../services/store';

const MAX_ROWS = 200;
const fmt = (ts: number) => new Date(ts).toLocaleString('es-CL');
const day = (ts: number) => new Date(ts).toLocaleDateString('sv-SE'); // YYYY-MM-DD local

/** Evita inyección de fórmulas al abrir el CSV en Excel (OWASP CSV injection). */
const csvCell = (v: string) => {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** Solo ADMIN: auditoría de solo lectura con filtros por actor, acción y fecha, y exportación CSV. */
export default function Audit() {
  const { session } = useAuth();
  const s = session as Session;
  const [all] = useState(() => listAudit(s));
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const actors = useMemo(() => [...new Set(all.map((a) => a.actor))].sort(), [all]);
  const actions = useMemo(() => [...new Set(all.map((a) => a.action))].sort(), [all]);
  const rows = useMemo(() => all.filter((a) =>
    (!actor || a.actor === actor) && (!action || a.action === action) &&
    (!from || day(a.ts) >= from) && (!to || day(a.ts) <= to)), [all, actor, action, from, to]);

  const exportCsv = () => {
    const head = ['Fecha', 'Actor', 'Acción', 'Objetivo', 'Antes', 'Después'];
    const lines = rows.map((a) => [new Date(a.ts).toISOString(), a.actor, a.action, a.target, a.before ?? '', a.after ?? ''].map(csvCell).join(','));
    const url = URL.createObjectURL(new Blob(['﻿' + [head.map(csvCell).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'auditoria.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section>
      <div className="page-head">
        <h2>Auditoría</h2>
        <p>Registro de solo lectura de las acciones realizadas en el sistema.</p>
      </div>
      <div className="card">
        <div className="filters">
          <label>Actor
            <select value={actor} onChange={(e) => setActor(e.target.value)}>
              <option value="">Todos</option>
              {actors.map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label>Acción
            <select value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="">Todas</option>
              {actions.map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label>Desde <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label>Hasta <input type="date" min={from} value={to} onChange={(e) => setTo(e.target.value)} /></label>
          <button type="button" className="secondary" onClick={exportCsv} disabled={rows.length === 0}>
            <Icon name="download" />Exportar CSV ({rows.length})
          </button>
        </div>
      </div>
      {rows.length > MAX_ROWS && <p className="hint">Mostrando los {MAX_ROWS} más recientes de {rows.length}; el CSV incluye todos.</p>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Fecha</th><th>Actor</th><th>Acción</th><th>Objetivo</th><th>Antes</th><th>Después</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td className="empty" colSpan={6}>Sin registros.</td></tr>}
            {rows.slice(0, MAX_ROWS).map((a, i) => (
              <tr key={i}>
                <td className="mono">{fmt(a.ts)}</td>
                <td><strong>{a.actor}</strong></td>
                <td><span className="badge role">{a.action}</span></td>
                <td>{a.target}</td>
                <td>{a.before ? <code>{a.before}</code> : '—'}</td>
                <td>{a.after ? <code>{a.after}</code> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
