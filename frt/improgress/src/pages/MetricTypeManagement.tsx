import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function MetricTypeManagement() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');

  const metricTypes = [
    { name: 'Población Total',             code: 'POB_TOTAL',     category: 'Demografía',     dataType: 'Integer' },
    { name: 'Tasa de Natalidad',           code: 'TASA_NAT',      category: 'Demografía',     dataType: 'Percentage' },
    { name: 'Índice de Desarrollo Humano', code: 'IDH',           category: 'Desarrollo',     dataType: 'Decimal' },
    { name: 'PIB per Cápita',              code: 'PIB_PC',        category: 'Economía',        dataType: 'Currency' },
    { name: 'Tasa de Alfabetización',      code: 'TASA_ALF',      category: 'Educación',       dataType: 'Percentage' },
    { name: 'Cobertura de Agua Potable',   code: 'COB_AGUA',      category: 'Infraestructura', dataType: 'Percentage' },
    { name: 'Densidad Poblacional',        code: 'DENS_POB',      category: 'Demografía',      dataType: 'Decimal' },
    { name: 'Tasa de Desempleo',           code: 'TASA_DES',      category: 'Economía',        dataType: 'Percentage' },
    { name: 'Cobertura de Salud',          code: 'COB_SALUD',     category: 'Salud',           dataType: 'Percentage' },
    { name: 'Índice de Pobreza',           code: 'IND_POB',       category: 'Desarrollo',      dataType: 'Percentage' },
    { name: 'Tasa de Mortalidad Infantil', code: 'TASA_MORT_INF', category: 'Salud',           dataType: 'Decimal' },
    { name: 'Acceso a Internet',           code: 'ACC_INT',       category: 'Tecnología',      dataType: 'Percentage' },
    { name: 'Superficie Territorial',      code: 'SUP_TERR',      category: 'Geografía',       dataType: 'Decimal' },
    { name: 'Número de Escuelas',          code: 'NUM_ESC',       category: 'Educación',       dataType: 'Integer' },
    { name: 'Producción Agrícola',         code: 'PROD_AGR',      category: 'Economía',        dataType: 'Currency' },
  ];

  const categories = ['All Categories', ...Array.from(new Set(metricTypes.map(m => m.category)))];

  const filtered = metricTypes.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
                        m.code.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All Categories' || m.category === category;
    return matchSearch && matchCat;
  });

  /* ── shared outline button style ── */
  const outlineBtn: React.CSSProperties = {
    height: '38px',
    padding: '0 16px',
    border: '1.5px solid #6366F1',
    borderRadius: '8px',
    background: 'transparent',
    color: '#6366F1',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 120ms ease',
    letterSpacing: '0.2px',
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
          MetricType Management
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            style={outlineBtn}
            onMouseEnter={e => (e.currentTarget.style.background = '#EEF2FF')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            IMPORT METRIC TYPES
          </button>
          <button
            style={outlineBtn}
            onMouseEnter={e => (e.currentTarget.style.background = '#EEF2FF')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            METRIC TYPE CATEGORIES
          </button>
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
              whiteSpace: 'nowrap',
              letterSpacing: '0.2px',
              transition: 'opacity 120ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            ADD NEW METRICTYPE
          </button>
        </div>
      </div>

      {/* Search + filter */}
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
            value={category}
            onChange={e => setCategory(e.target.value)}
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
            {categories.map(c => <option key={c}>{c}</option>)}
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

      {/* Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
              {['NAME', 'CODE', 'CATEGORY', 'DATA TYPE'].map(h => (
                <th
                  key={h}
                  style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 15).map((m, i) => (
              <tr
                key={m.code}
                style={{ borderBottom: i < filtered.slice(0, 15).length - 1 ? '1px solid #F3F4F6' : 'none' }}
              >
                <td style={{ padding: '18px 24px', fontSize: '14px', color: '#111827' }}>{m.name}</td>
                <td style={{ padding: '18px 24px', fontSize: '14px', color: '#111827' }}>{m.code}</td>
                <td style={{ padding: '18px 24px', fontSize: '14px', color: '#111827' }}>{m.category}</td>
                <td style={{ padding: '18px 24px', fontSize: '14px', color: '#111827' }}>{m.dataType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
