import { Outlet, NavLink } from 'react-router'

const navItems = [
  { to: '/departments',            label: 'Departments' },
  { to: '/metric-types',           label: 'Metric Types' },
  { to: '/metric-type-categories', label: 'Categories' },
  { to: '/import-data',            label: 'Import Data' },
  { to: '/map',                    label: 'Map' },
]

export function Layout() {
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

          {/* Nav tabs — right */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {navItems.map(({ to, label }) => (
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
        </div>
      </header>

      {/* ── Page Content ── */}
      <main style={{
        padding: '32px 32px',
      }}>
        <Outlet />
      </main>
    </div>
  )
}
