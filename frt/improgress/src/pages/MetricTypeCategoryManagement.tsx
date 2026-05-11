import { useState, useEffect } from 'react';
import { api, type MetricTypeCategory } from '../lib/api';

export function MetricTypeCategoryManagement() {
  const [categories, setCategories] = useState<MetricTypeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadCategories = () => {
    setLoading(true);
    api.get<MetricTypeCategory[]>('/api/v1/management/metric-type-categories')
      .then(setCategories)
      .catch(err => setError(err instanceof Error ? err.message : 'Error al cargar categorías'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCategories(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la categoría "${name}"?`)) return;
    try {
      await api.delete(`/api/v1/management/metric-type-categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

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

      {/* Status */}
      {loading && <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Cargando...</p>}
      {error && <p style={{ fontSize: '13px', color: '#DC2626', marginBottom: '8px' }}>{error}</p>}
      {!loading && !error && (
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px', display: 'block' }}>
          Showing 1 to {filtered.length} of {filtered.length} results
        </p>
      )}

      {/* Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                CATEGORY NAME
              </th>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                METRIC TYPES
              </th>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                STATUS
              </th>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cat, i) => (
              <tr
                key={cat.id}
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F3F4F6' : 'none' }}
              >
                <td style={{ padding: '18px 24px', fontSize: '14px', color: '#111827' }}>
                  {cat.name}
                </td>
                <td style={{ padding: '18px 24px', fontSize: '14px', color: '#6B7280' }}>
                  {cat.metric_type_count}
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: cat.is_active ? '#D1FAE5' : '#FEE2E2',
                    color: cat.is_active ? '#065F46' : '#991B1B',
                  }}>
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* EDIT */}
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

                    {/* DELETE */}
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
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
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                  No se encontraron categorías
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
