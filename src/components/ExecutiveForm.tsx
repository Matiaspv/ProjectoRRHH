import { useState, type FormEvent } from 'react';
import type { Campaign, ExecutiveInput, Vigencia } from '../domain/types';
import { REGIONES } from '../domain/validation';

const EMPTY = (campaignId: string): ExecutiveInput => ({
  rut: '', name: '', region: '', age: 18, campaignId, startDate: '', vigencia: 'Vigente', endDate: '', reason: '',
});

interface Props {
  campaigns: Campaign[];
  initial?: ExecutiveInput;
  submitLabel: string;
  onSubmit: (data: ExecutiveInput) => void;
  onCancel?: () => void;
}

export default function ExecutiveForm({ campaigns, initial, submitLabel, onSubmit, onCancel }: Props) {
  const active = campaigns.filter((c) => c.active);
  const [f, setF] = useState<ExecutiveInput>(() => initial ?? EMPTY(active[0]?.id ?? ''));
  const set = <K extends keyof ExecutiveInput>(k: K, v: ExecutiveInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const vigente = f.vigencia === 'Vigente';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(f);
    if (!initial) setF(EMPTY(active[0]?.id ?? ''));
  };

  return (
    <form onSubmit={submit} className="card row">
      <input placeholder="RUT 12345678-5" value={f.rut} onChange={(e) => set('rut', e.target.value)} required />
      <input placeholder="Nombre" value={f.name} onChange={(e) => set('name', e.target.value)} required />
      <select value={f.region} onChange={(e) => set('region', e.target.value)} required>
        <option value="">Región…</option>
        {REGIONES.map((r) => <option key={r}>{r}</option>)}
      </select>
      <label>Edad <input type="number" min={18} max={100} value={f.age} onChange={(e) => set('age', Number(e.target.value))} required /></label>
      <label>Vigencia
        <select value={f.vigencia} onChange={(e) => set('vigencia', e.target.value as Vigencia)}>
          <option>Vigente</option>
          <option>No vigente</option>
        </select>
      </label>
      {vigente ? (
        <label>Campaña
          <select value={f.campaignId} onChange={(e) => set('campaignId', e.target.value)} required>
            {active.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      ) : (
        <small>Los no vigentes se asignan a la campaña "noname".</small>
      )}
      <label>Fecha inicio <input type="date" value={f.startDate} onChange={(e) => set('startDate', e.target.value)} required /></label>
      <label>Fecha término <input type="date" min={f.startDate} value={f.endDate} onChange={(e) => set('endDate', e.target.value)} required={!vigente} /></label>
      <input placeholder="Motivo" maxLength={300} value={f.reason} onChange={(e) => set('reason', e.target.value)} required={!vigente} />
      <button>{submitLabel}</button>
      {onCancel && <button type="button" onClick={onCancel}>Cancelar</button>}
    </form>
  );
}
