import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { Session } from '../domain/types';
import { listCampaigns, listVigencia } from '../services/store';

/** Historial de periodos de vigencia (inicio = pasó a Vigente, término = pasó a No vigente). */
export default function Vigencia() {
  const { session } = useAuth();
  const s = session as Session;
  const [rows] = useState(() => listVigencia(s).slice().sort((a, b) => b.startDate.localeCompare(a.startDate)));
  const [campaigns] = useState(() => listCampaigns(s));
  const campaignName = (id: string) => campaigns.find((c) => c.id === id)?.name ?? '—';

  return (
    <section>
      <div className="page-head">
        <h2>Historial de vigencia</h2>
        <p>Periodos en que cada ejecutivo estuvo vigente.</p>
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
            {rows.length === 0 && <tr><td className="empty" colSpan={8}>Sin registros.</td></tr>}
            {rows.map((p) => (
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
