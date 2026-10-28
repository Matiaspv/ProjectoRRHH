import { useState, type FormEvent } from 'react';
import type { Campaign, Executive, ExecutiveInput } from '../domain/types';
import { REGIONES } from '../domain/validation';

const EMPTY: ExecutiveInput = { rut: '', name: '', lastName: '', region: '', age: 18, campaignId: null, reason: '' };

interface Props {
  campaigns: Campaign[];
  /** Con `initial` es edición: agrega campaña y motivo. Sin él es el alta (solo datos personales). */
  initial?: Executive;
  submitLabel: string;
  onSubmit: (data: ExecutiveInput) => void;
  onCancel?: () => void;
}

export default function ExecutiveForm({ campaigns, initial, submitLabel, onSubmit, onCancel }: Props) {
  const [f, setF] = useState<ExecutiveInput>(() => (initial ? { ...initial, reason: '' } : EMPTY));
  const set = <K extends keyof ExecutiveInput>(k: K, v: ExecutiveInput[K]) => setF((p) => ({ ...p, [k]: v }));
  // El motivo se pide solo al pasar a "Ninguna" desde una campaña.
  const leaving = !!initial && initial.campaignId !== null && f.campaignId === null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(f);
    if (!initial) setF(EMPTY);
  };

  return (
    <form onSubmit={submit} className="card" autoComplete="off">
      <h3 className="card-title">{initial ? 'Modificar ejecutivo' : 'Datos del ejecutivo'}</h3>
      <div className="form-grid">
        <label>RUT
          <input placeholder="12345678-5" value={f.rut} onChange={(e) => set('rut', e.target.value)} required spellCheck={false} />
        </label>
        <label>Nombre
          <input value={f.name} onChange={(e) => set('name', e.target.value)} required />
        </label>
        <label>Apellido
          <input value={f.lastName} onChange={(e) => set('lastName', e.target.value)} required />
        </label>
        <label>Región
          <select value={f.region} onChange={(e) => set('region', e.target.value)} required>
            <option value="">Selecciona…</option>
            {REGIONES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label>Edad
          <input type="number" min={18} max={100} value={f.age} onChange={(e) => set('age', Number(e.target.value))} required />
        </label>
        {initial && (
          <label>Campaña
            <select value={f.campaignId ?? ''} onChange={(e) => set('campaignId', e.target.value || null)}>
              <option value="">Ninguna</option>
              {campaigns.filter((c) => c.active || c.id === initial.campaignId).map((c) => (
                <option key={c.id} value={c.id} disabled={!c.active}>{c.name}</option>
              ))}
            </select>
          </label>
        )}
        {leaving && (
          <label className="wide">Motivo
            <input maxLength={300} value={f.reason} onChange={(e) => set('reason', e.target.value)} required />
          </label>
        )}
      </div>
      <div className="form-actions">
        <button>{submitLabel}</button>
        {onCancel && <button type="button" className="secondary" onClick={onCancel}>Cancelar</button>}
      </div>
    </form>
  );
}
