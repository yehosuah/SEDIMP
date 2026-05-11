import { useState } from 'react';

export function MetricTypeCategoryManagement() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All Categories');

  const categories = [
    { name: 'Demografía' },
    { name: 'Economía' },
    { name: 'Educación' },
    { name: 'Salud' },
    { name: 'Infraestructura' },
    { name: 'Desarrollo' },
    { name: 'Tecnología' },
    { name: 'Geografía' },
  ];

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
          MetricTypeCategory Management
        </h1>
        <button
          style={{
            height: '38px',
            padding: '0 18px',
            border: 'none',
            borderRadius: '8px',
            background: '#111827',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.2px',
            transition: 'opacity 120ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          ADD NEW METRICTYPECATEGORY
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            height: '40px',
            padding: '0 14px',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#111827',
            background: '#FFFFFF',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Filter dropdown */}
      <div style={{ position: 'relative', marginBottom: '10px', display: 'inline-block' }}>
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
          <option>All Categories</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
        {/* chevron */}
        <svg
          width="15" height="15" viewBox="0 0 24 24" fill="none"
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280' }}
        >
          <path d="M6 9l6 6 6-6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Results count */}
      <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px', display: 'block' }}>
        Showing 1 to {filtered.length} of {filtered.length} results
      </p>

      {/* Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                CATEGORY NAME
              </th>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cat, i) => (
              <tr
                key={cat.name}
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F3F4F6' : 'none' }}
              >
                <td style={{ padding: '18px 24px', fontSize: '14px', color: '#111827' }}>
                  {cat.name}
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* EDIT — indigo outline */}
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
                        letterSpacing: '0.2px',
                        transition: 'background 120ms ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#EEF2FF')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      EDIT
                    </button>

                    {/* DELETE — red solid */}
                    <button
                      style={{
                        padding: '5px 18px',
                        border: 'none',
                        borderRadius: '6px',
                        background: '#EF4444',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        letterSpacing: '0.2px',
                        transition: 'opacity 120ms ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      DELETE
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
