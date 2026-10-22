import { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import type { Role } from './domain/types';
import Campaigns from './pages/Campaigns';
import ChangePassword from './pages/ChangePassword';
import Executives from './pages/Executives';
import Login from './pages/Login';
import Users from './pages/Users';
import Vigencia from './pages/Vigencia';

type Tab = 'executives' | 'campaigns' | 'vigencia' | 'users';

/** Vistas disponibles por rol; la primera es la de inicio. */
const TABS: Record<Role, { id: Tab; label: string }[]> = {
  ADMIN: [
    { id: 'executives', label: 'Ejecutivos' },
    { id: 'campaigns', label: 'Campañas' },
    { id: 'vigencia', label: 'Vigencia' },
    { id: 'users', label: 'Usuarios' },
  ],
  RECLUTADOR: [
    { id: 'executives', label: 'Ingresar ejecutivo' },
    { id: 'campaigns', label: 'Campañas' },
    { id: 'vigencia', label: 'Vigencia' },
  ],
};

export default function App() {
  const { session, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('executives');

  if (!session) return <Login />;
  if (session.mustChangePassword) return <ChangePassword />;
  const tabs = TABS[session.role];
  const current = tabs.some((t) => t.id === tab) ? tab : tabs[0].id;

  return (
    <>
      <header className="bar">
        <strong>Gestión RRHH</strong>
        <nav>
          {tabs.map((t) => <button key={t.id} onClick={() => setTab(t.id)}>{t.label}</button>)}
        </nav>
        <span>{session.username} ({session.role}) <button onClick={logout}>Salir</button></span>
      </header>
      <main className="page">
        {current === 'users' && <Users />}
        {current === 'campaigns' && <Campaigns />}
        {current === 'vigencia' && <Vigencia />}
        {current === 'executives' && <Executives showList={session.role === 'ADMIN'} />}
      </main>
    </>
  );
}
