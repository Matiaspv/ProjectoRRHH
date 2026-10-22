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
      <h2>Historial de vigencia</h2>
      <table>
        <thead>
          <tr><th>RUT</th><th>Nombre</th><th>Región</th><th>Edad</th><th>Campaña</th><th>Inicio vigencia</th><th>Término (no vigente)</th><th>Motivo</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={8}>Sin registros.</td></tr>}
          {rows.map((p) => (
            <tr key={p.id}>
              <td>{p.rut}</td><td>{p.name}</td><td>{p.region}</td><td>{p.age}</td><td>{campaignName(p.campaignId)}</td>
              <td>{p.startDate}</td><td>{p.endDate || 'Vigente'}</td><td>{p.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
