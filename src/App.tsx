import { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import AppShell, { type NavItem } from './components/AppShell';
import { can, type Action } from './domain/permissions';
import type { Role } from './domain/types';
import Campaigns from './pages/Campaigns';
import ChangePassword from './pages/ChangePassword';
import CreateExecutive from './pages/CreateExecutive';
import Executives from './pages/Executives';
import Login from './pages/Login';
import Users from './pages/Users';
import Vigencia from './pages/Vigencia';

type Tab = 'exec-create' | 'exec-list' | 'campaigns' | 'vigencia' | 'users';

interface Child { id: Tab; label: string; action: Action }
interface Entry { id: string; action: Action; icon: NavItem['icon']; label: Record<Role, string>; children?: Child[] }

/** Cada opción del panel lateral exige un permiso: solo se muestra lo que el rol puede usar. La primera es la de inicio. */
const NAV: Entry[] = [
  {
    id: 'executives', action: 'executive:write', icon: 'userPlus', label: { ADMIN: 'Ejecutivos', RECLUTADOR: 'Ejecutivos' },
    children: [
      { id: 'exec-create', label: 'Crear ejecutivo', action: 'executive:write' },
      { id: 'exec-list', label: 'Ver ejecutivos', action: 'executive:delete' }, // la lista completa es solo del admin
    ],
  },
  { id: 'campaigns', action: 'campaign:read', icon: 'flag', label: { ADMIN: 'Campañas', RECLUTADOR: 'Campañas' } },
  { id: 'vigencia', action: 'vigencia:read', icon: 'history', label: { ADMIN: 'Vigencia', RECLUTADOR: 'Vigencia' } },
  { id: 'users', action: 'user:list', icon: 'users', label: { ADMIN: 'Usuarios y auditoría', RECLUTADOR: 'Usuarios' } },
];

export default function App() {
  const { session, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('exec-create');

  if (!session) return <Login />;
  if (session.mustChangePassword) return <ChangePassword />;
  const items = NAV.filter((n) => can(session.role, n.action)).map((n) => ({
    ...n, children: n.children?.filter((c) => can(session.role, c.action)),
  }));
  const tabs = items.flatMap((n) => n.children?.map((c) => c.id) ?? [n.id]);
  const current = tabs.includes(tab) ? tab : tabs[0];

  return (
    <AppShell
      session={session}
      items={items.map((n) => ({ id: n.id, icon: n.icon, label: n.label[session.role], children: n.children }))}
      current={current}
      onNavigate={(id) => setTab(id as Tab)}
      onLogout={logout}
    >
      {current === 'users' && <Users />}
      {current === 'campaigns' && <Campaigns />}
      {current === 'vigencia' && <Vigencia />}
      {current === 'exec-create' && <CreateExecutive />}
      {current === 'exec-list' && <Executives />}
    </AppShell>
  );
}
