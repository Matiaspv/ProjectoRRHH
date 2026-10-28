import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import ExecutiveTable from '../components/ExecutiveTable';
import type { Session } from '../domain/types';
import { cleanRut } from '../domain/validation';
import { listCampaigns, listExecutives } from '../services/store';

/** Lista completa de ejecutivos (solo admin). */
export default function Executives() {
  const { session } = useAuth();
  const s = session as Session;
  const [rows, setRows] = useState(() => listExecutives(s));
  const [campaigns] = useState(() => listCampaigns(s));

  const [by, setBy] = useState<'rut' | 'name'>('rut');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const qRut = cleanRut(query).toLowerCase();
  const shown = !q ? rows : rows.filter((e) =>
    by === 'rut' ? e.rut.toLowerCase().includes(qRut) : `${e.name} ${e.lastName}`.toLowerCase().includes(q));

  return (
    <section>
      <div className="page-head">
        <h2>Ver ejecutivos</h2>
        <p>{q ? `${shown.length} de ${rows.length}` : rows.length} registrados</p>
      </div>
      <div className="search-bar">
        <select aria-label="Buscar por" value={by} onChange={(e) => setBy(e.target.value as 'rut' | 'name')}>
          <option value="rut">RUT</option>
          <option value="name">Nombre</option>
        </select>
        <input type="search" aria-label="Buscar ejecutivo" placeholder={by === 'rut' ? 'Buscar por RUT…' : 'Buscar por nombre o apellido…'}
               value={query} onChange={(e) => setQuery(e.target.value)} spellCheck={false} />
      </div>
      <ExecutiveTable rows={shown} campaigns={campaigns} onChange={() => setRows(listExecutives(s))} />
    </section>
  );
}
