import { useState, type ReactNode } from 'react';
import type { Session } from '../domain/types';
import { useTheme } from '../theme';
import Icon, { type IconName } from './Icon';

export interface NavItem { id: string; label: string; icon: IconName }

interface Props {
  session: Session;
  items: NavItem[];
  current: string;
  onNavigate: (id: string) => void;
  onLogout: () => void;
  children: ReactNode;
}

const ROLE_LABEL = { ADMIN: 'Administrador', RECLUTADOR: 'Reclutador' } as const;

/** Marco común de todas las vistas autenticadas: barra superior + panel lateral según permisos. */
export default function AppShell({ session, items, current, onNavigate, onLogout, children }: Props) {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const go = (id: string) => { onNavigate(id); setOpen(false); };

  return (
    <>
      <a href="#contenido" className="skip-link">Saltar al contenido</a>
      <header className="topbar">
        <div className="topbar-left">
          <button type="button" className="ghost menu-toggle" aria-label="Abrir menú" aria-expanded={open} aria-controls="menu-lateral"
                  onClick={() => setOpen((o) => !o)}>
            <Icon name={open ? 'x' : 'menu'} />
          </button>
          <div className="brand">
            <span className="brand-mark"><Icon name="briefcase" /></span>
            Gestión RRHH
          </div>
        </div>
        <div className="topbar-right">
          <div className="user-chip">
            <span className="avatar" aria-hidden="true">{session.username.slice(0, 1)}</span>
            <span className="user-meta">
              <strong>{session.username}</strong>
              <small>{ROLE_LABEL[session.role]}</small>
            </span>
          </div>
          <button type="button" className="ghost theme-toggle" onClick={toggle}
                  aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                  title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <button type="button" className="secondary sm" onClick={onLogout}><Icon name="logout" />Salir</button>
        </div>
      </header>

      <nav id="menu-lateral" className={`sidebar${open ? ' open' : ''}`} aria-label="Navegación principal">
        <span className="side-label">Menú</span>
        {items.map((it) => (
          <button key={it.id} type="button" className="nav-item" aria-current={it.id === current ? 'page' : undefined} onClick={() => go(it.id)}>
            <Icon name={it.icon} />{it.label}
          </button>
        ))}
        <span className="side-foot">Acceso restringido por rol · sesión con cierre por inactividad</span>
      </nav>
      <div className={`scrim${open ? ' open' : ''}`} onClick={() => setOpen(false)} />

      <main id="contenido" className="content" tabIndex={-1}>
        <div className="content-inner">{children}</div>
      </main>
    </>
  );
}
