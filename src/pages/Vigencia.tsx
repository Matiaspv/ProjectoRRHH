import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { Session } from '../domain/types';
import { cleanRut } from '../domain/validation';
import { listCampaigns, listVigencia } from '../services/store';

/** Historial de periodos de vigencia (inicio = pasó a Vigente, término = pasó a No vigente). */
export default function Vigencia() {
  const { session } = useAuth();
  const s = session as Session;
  const [rows] = useState(() => listVigencia(s).slice().sort((a, b) => b.startDate.localeCompare(a.startDate)));
  const [campaigns] = useState(() => listCampaigns(s));
  const campaignName = (id: string | null) => campaigns.find((c) => c.id === id)?.name ?? '—';

  const [by, setBy] = useState<'rut' | 'name'>('rut');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const qRut = cleanRut(query).toLowerCase();
  const shown = !q ? rows : rows.filter((p) =>
    by === 'rut' ? cleanRut(p.rut).toLowerCase().includes(qRut) : p.name.toLowerCase().includes(q));

  return (
    <section>
      <div className="page-head">
        <h2>Historial de vigencia</h2>
        <p>Periodos en que cada ejecutivo estuvo vigente. {q && `${shown.length} de ${rows.length} registros.`}</p>
      </div>
      <div className="search-bar">
        <select aria-label="Buscar por" value={by} onChange={(e) => setBy(e.target.value as 'rut' | 'name')}>
          <option value="rut">RUT</option>
          <option value="name">Nombre</option>
        </select>
        <input type="search" aria-label="Buscar en vigencia" placeholder={by === 'rut' ? 'Buscar por RUT…' : 'Buscar por nombre…'}
               value={query} onChange={(e) => setQuery(e.target.value)} spellCheck={false} />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>RUT</th><th>Nombre</th><th>Región</th><th className="num">Edad</th><th>Campaña</th>
              <th>Inicio vigencia</th><th>Término</th><th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && <tr><td className="empty" colSpan={8}>Sin registros.</td></tr>}
            {shown.map((p) => (
              <tr key={p.id}>
                <td className="mono">{p.rut}</td>
                <td><div className="person"><span className="avatar" aria-hidden="true">{p.name.slice(0, 1)}</span><strong>{p.name}</strong></div></td>
                <td className="muted">{p.region}</td>
                <td className="num">{p.age}</td>
                <td>{campaignName(p.campaignId)}</td>
                <td className="mono">{p.startDate}</td>
                <td>{p.endDate ? <span className="mono">{p.endDate}</span> : <span className="badge ok">Vigente</span>}</td>
                <td className="muted">{p.reason || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
