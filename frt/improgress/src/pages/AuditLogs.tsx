import { useState, useEffect } from 'react';
import { api, type AuditLogRead } from '../lib/api';

const PAGE_SIZE = 50;

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async (currentOffset: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<AuditLogRead[]>(
        `/api/v1/management/audit-logs?limit=${PAGE_SIZE}&offset=${currentOffset}`
      );
      setLogs(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la bitácora.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadLogs(offset);
    });
  }, [offset]);

  const handleNext = () => {
    if (hasMore) setOffset(prev => prev + PAGE_SIZE);
  };

  const handlePrev = () => {
    setOffset(prev => Math.max(0, prev - PAGE_SIZE));
  };

  const filteredLogs = logs.filter(log => {
    const term = search.toLowerCase();
    return (
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.user_id && log.user_id.toLowerCase().includes(term)) ||
      (log.entity_type && log.entity_type.toLowerCase().includes(term)) ||
      (log.detail && log.detail.toLowerCase().includes(term)) ||
      (log.ip_address && log.ip_address.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
          Bitácora de Auditoría
        </h1>
        <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
          Registro histórico de acciones de administración y modificaciones en el sistema.
        </p>
      </div>

      {/* Search and Pagination bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Filtrar eventos en esta página..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '240px',
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

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handlePrev}
            disabled={offset === 0 || loading}
            style={{
              height: '38px',
              padding: '0 14px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              background: '#FFFFFF',
              color: '#374151',
              fontSize: '13px',
              fontWeight: 600,
              cursor: offset === 0 || loading ? 'not-allowed' : 'pointer',
              opacity: offset === 0 || loading ? 0.6 : 1,
            }}
          >
            Anterior
          </button>
          <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
            Registros {offset + 1} - {offset + logs.length}
          </span>
          <button
            onClick={handleNext}
            disabled={!hasMore || loading}
            style={{
              height: '38px',
              padding: '0 14px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              background: '#FFFFFF',
              color: '#374151',
              fontSize: '13px',
              fontWeight: 600,
              cursor: !hasMore || loading ? 'not-allowed' : 'pointer',
              opacity: !hasMore || loading ? 0.6 : 1,
            }}
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Loading/Error State */}
      {loading && <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Cargando bitácora...</p>}
      {error && <p style={{ fontSize: '13px', color: '#DC2626', marginBottom: '8px' }}>{error}</p>}

      {/* Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', width: '180px' }}>
                Fecha / Hora
              </th>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', width: '180px' }}>
                Usuario ID
              </th>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', width: '140px' }}>
                Acción
              </th>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', width: '150px' }}>
                Entidad
              </th>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Detalles
              </th>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', width: '130px' }}>
                IP Address
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, i) => (
              <tr
                key={log.id}
                style={{ borderBottom: i < filteredLogs.length - 1 ? '1px solid #F3F4F6' : 'none' }}
              >
                <td style={{ padding: '14px 24px', fontSize: '13px', color: '#111827' }}>
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td style={{ padding: '14px 24px', fontSize: '13px', color: '#4B5563', fontFamily: 'monospace' }}>
                  {log.user_id || 'Sistema'}
                </td>
                <td style={{ padding: '14px 24px' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    background: log.action.includes('create') || log.action.includes('invite') ? '#D1FAE5' : log.action.includes('delete') ? '#FEE2E2' : '#EFF6FF',
                    color: log.action.includes('create') || log.action.includes('invite') ? '#065F46' : log.action.includes('delete') ? '#991B1B' : '#1D4ED8',
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: '14px 24px', fontSize: '13px', color: '#4B5563' }}>
                  {log.entity_type ? `${log.entity_type} (${log.entity_id || 'N/A'})` : '-'}
                </td>
                <td style={{ padding: '14px 24px', fontSize: '13px', color: '#111827', lineHeight: '1.4' }}>
                  {log.detail || '-'}
                </td>
                <td style={{ padding: '14px 24px', fontSize: '13px', color: '#6B7280', fontFamily: 'monospace' }}>
                  {log.ip_address || '-'}
                </td>
              </tr>
            ))}
            {!loading && filteredLogs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                  No se encontraron registros de auditoría
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
