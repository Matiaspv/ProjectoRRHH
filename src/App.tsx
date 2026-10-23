import { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import AppShell, { type NavItem } from './components/AppShell';
import { can, type Action } from './domain/permissions';
import type { Role } from './domain/types';
import Campaigns from './pages/Campaigns';
import ChangePassword from './pages/ChangePassword';
import Executives from './pages/Executives';
import Login from './pages/Login';
import Users from './pages/Users';
import Vigencia from './pages/Vigencia';

type Tab = 'executives' | 'campaigns' | 'vigencia' | 'users';

interface Entry { id: Tab; action: Action; icon: NavItem['icon']; label: Record<Role, string> }

/** Cada opción del panel lateral exige un permiso: solo se muestra lo que el rol puede usar. La primera es la de inicio. */
const NAV: Entry[] = [
  { id: 'executives', action: 'executive:write', icon: 'userPlus', label: { ADMIN: 'Ejecutivos', RECLUTADOR: 'Ingresar ejecutivo' } },
  { id: 'campaigns', action: 'campaign:read', icon: 'flag', label: { ADMIN: 'Campañas', RECLUTADOR: 'Campañas' } },
  { id: 'vigencia', action: 'vigencia:read', icon: 'history', label: { ADMIN: 'Vigencia', RECLUTADOR: 'Vigencia' } },
  { id: 'users', action: 'user:list', icon: 'users', label: { ADMIN: 'Usuarios y auditoría', RECLUTADOR: 'Usuarios' } },
];

export default function App() {
  const { session, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('executives');

  if (!session) return <Login />;
  if (session.mustChangePassword) return <ChangePassword />;
  const items = NAV.filter((n) => can(session.role, n.action));
  const current = items.some((t) => t.id === tab) ? tab : items[0].id;

  return (
    <AppShell
      session={session}
      items={items.map((n) => ({ id: n.id, icon: n.icon, label: n.label[session.role] }))}
      current={current}
      onNavigate={(id) => setTab(id as Tab)}
      onLogout={logout}
    >
      {current === 'users' && <Users />}
      {current === 'campaigns' && <Campaigns />}
      {current === 'vigencia' && <Vigencia />}
      {current === 'executives' && <Executives showList={session.role === 'ADMIN'} />}
    </AppShell>
  );
}
