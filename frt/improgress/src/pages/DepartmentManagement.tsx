import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function DepartmentManagement() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All Departments');

  const departments = [
    { name: 'Alta Verapaz', code: '16' },
    { name: 'Baja Verapaz', code: '15' },
    { name: 'Chimaltenango', code: '04' },
    { name: 'Chiquimula', code: '20' },
    { name: 'El Progreso', code: '02' },
    { name: 'Escuintla', code: '05' },
    { name: 'Guatemala', code: '01' },
    { name: 'Huehuetenango', code: '13' },
    { name: 'Izabal', code: '18' },
    { name: 'Jalapa', code: '21' },
    { name: 'Jutiapa', code: '22' },
    { name: 'Petén', code: '17' },
    { name: 'Quetzaltenango', code: '09' },
    { name: 'Quiché', code: '14' },
    { name: 'Retalhuleu', code: '11' },
  ];

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

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
        {/* Search */}
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

        {/* Filter dropdown */}
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

      {/* Results count */}
      <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
        Showing 1 to {Math.min(filtered.length, 15)} of {filtered.length} results
      </p>

      {/* Table — no card, just white background */}
      <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                NAME
              </th>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                CODDEP
              </th>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 15).map((dept, index) => (
              <tr
                key={dept.code}
                style={{
                  borderBottom: index < filtered.length - 1 ? '1px solid #F3F4F6' : 'none',
                }}
              >
                <td style={{ padding: '18px 24px', fontSize: '14px', color: '#111827' }}>
                  {dept.name}
                </td>
                <td style={{ padding: '18px 24px', fontSize: '14px', color: '#111827' }}>
                  {dept.code}
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
