import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { api, type MetricType, type MetricTypeCategory } from '../lib/api';

export function MetricTypeManagement() {
  const [metricTypes, setMetricTypes] = useState<MetricType[]>([]);
  const [categories, setCategories] = useState<MetricTypeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');

  useEffect(() => {
    Promise.all([
      api.get<MetricType[]>('/api/v1/management/metric-types'),
      api.get<MetricTypeCategory[]>('/api/v1/management/metric-type-categories'),
    ])
      .then(([types, cats]) => {
        setMetricTypes(types);
        setCategories(cats);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Error al cargar datos'))
      .finally(() => setLoading(false));
  }, []);

  const categoryOptions = ['All Categories', ...categories.map(c => c.name)];

  const filtered = metricTypes.filter(m => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All Categories' || m.category_name === categoryFilter;
    return matchSearch && matchCat;
  });

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
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
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
            {categoryOptions.map(c => <option key={c}>{c}</option>)}
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
              {[['NAME', '200px'], ['CODE', '140px'], ['CATEGORY', ''], ['DATA TYPE', ''], ['STATUS', '']].map(([h, w]) => (
                <th
                  key={h}
                  style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', width: w || undefined }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr
                key={m.code}
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F3F4F6' : 'none' }}
              >
                <td style={{ padding: '18px 24px', fontSize: '14px', color: '#111827', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.name}>{m.name}</td>
                <td style={{ padding: '18px 24px', fontSize: '14px', color: '#111827', fontFamily: 'monospace', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.code}>{m.code}</td>
                <td style={{ padding: '18px 24px', fontSize: '14px', color: '#111827' }}>{m.category_name}</td>
                <td style={{ padding: '18px 24px', fontSize: '14px', color: '#111827' }}>{m.data_type}</td>
                <td style={{ padding: '18px 24px' }}>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: m.is_active ? '#D1FAE5' : '#FEE2E2',
                    color: m.is_active ? '#065F46' : '#991B1B',
                  }}>
                    {m.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                  No se encontraron tipos de métrica
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
