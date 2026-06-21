import { useState } from 'react';
import { Outlet, NavLink } from 'react-router';
import { useAuth } from '../lib/AuthContext';
import { ChangePasswordModal } from './ChangePasswordModal';

export function Layout() {
  const { user, logout } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const navItems = [
    { to: '/map',                    label: 'Mapa' },
    { to: '/departments',            label: 'Departamentos' },
    { to: '/metric-types',           label: 'Métricas' },
    { to: '/metric-type-categories', label: 'Categorías' },
    { to: '/import-data',            label: 'Importar Datos', roles: ['admin', 'editor'] },
    { to: '/users',                  label: 'Usuarios', roles: ['admin'] },
    { to: '/audit-logs',             label: 'Auditoría', roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role.name);
  });

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ── Top Navbar ── */}
      <header style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          padding: '0 32px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo — left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="6" fill="#E8541A" />
              <rect x="7"  y="7"  width="7" height="7" rx="1.5" fill="white" />
              <rect x="18" y="7"  width="7" height="7" rx="1.5" fill="white" />
              <rect x="7"  y="18" width="7" height="7" rx="1.5" fill="white" />
              <rect x="18" y="18" width="7" height="7" rx="1.5" fill="white" />
            </svg>
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.4px', color: '#111111' }}>
              <span style={{ color: '#E8541A' }}>IM</span>PROGRESS
            </span>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', flexGrow: 1, marginLeft: '32px' }}>
            {filteredNavItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#111827' : '#6B7280',
                  background: isActive ? '#F3F4F6' : 'transparent',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  transition: 'all 120ms ease',
                })}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* User Profile / Settings — right */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                  {user.full_name || user.email}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <span style={{
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    background: user.role.name === 'admin' ? '#EEF2FF' : user.role.name === 'editor' ? '#FDF2F8' : '#F3F4F6',
                    color: user.role.name === 'admin' ? '#4F46E5' : user.role.name === 'editor' ? '#DB2777' : '#4B5563',
                  }}>
                    {user.role.name}
                  </span>
                </div>
              </div>

              {/* Password Key Icon */}
              <button
                title="Cambiar contraseña"
                onClick={() => setIsPasswordModalOpen(true)}
                style={{
                  background: 'none',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 120ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
              </button>

              {/* Logout Button */}
              <button
                onClick={logout}
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  color: '#DC2626',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'opacity 120ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Salir
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Page Content ── */}
      <main style={{ padding: '32px 32px' }}>
        <Outlet />
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
