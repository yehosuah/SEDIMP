import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { api, type Department } from '../lib/api';

export function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All Departments');

  useEffect(() => {
    api.get<Department[]>('/api/v1/management/departments')
      .then(setDepartments)
      .catch(err => setError(err instanceof Error ? err.message : 'Error al cargar departamentos'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = departments.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'All Departments' ||
      (filter === 'Active' && d.is_active) ||
      (filter === 'Inactive' && !d.is_active);
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
          Department Management
        </h1>
        <button
          style={{
            backgroundColor: '#111827',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.3px',
            transition: 'opacity 150ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          ADD NEW DEPARTMENT
        </button>
      </div>

      {/* Search + filter row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1,
            height: '40px',
            padding: '0 14px',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#111827',
            background: '#FFFFFF',
            outline: 'none',
          }}
        />

        <div style={{ position: 'relative' }}>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{
              appearance: 'none',
              height: '40px',
              padding: '0 36px 0 14px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#111827',
              background: '#FFFFFF',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '160px',
            }}
          >
            <option>All Departments</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <ChevronDown
            size={15}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }}
          />
        </div>
      </div>

      {/* Status */}
      {loading && <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Cargando...</p>}
      {error && <p style={{ fontSize: '13px', color: '#DC2626', marginBottom: '8px' }}>{error}</p>}
      {!loading && !error && (
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
          Showing 1 to {filtered.length} of {filtered.length} results
        </p>
      )}

      {/* Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
              {['NAME', 'CODDEP', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((dept, index) => (
              <tr
                key={dept.code}
                style={{ borderBottom: index < filtered.length - 1 ? '1px solid #F3F4F6' : 'none' }}
              >
                <td style={{ padding: '18px 24px', fontSize: '14px', color: '#111827' }}>{dept.name}</td>
                <td style={{ padding: '18px 24px', fontSize: '14px', color: '#111827' }}>{dept.code}</td>
                <td style={{ padding: '18px 24px' }}>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: dept.is_active ? '#D1FAE5' : '#FEE2E2',
                    color: dept.is_active ? '#065F46' : '#991B1B',
                  }}>
                    {dept.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <button
                    style={{
                      padding: '5px 18px',
                      border: '1.5px solid #6366F1',
                      borderRadius: '6px',
                      background: 'transparent',
                      color: '#6366F1',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 120ms ease',
                      letterSpacing: '0.2px',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#EEF2FF')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    EDIT
                  </button>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                  No se encontraron departamentos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
