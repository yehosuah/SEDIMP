import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { useEffect, useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import L, { type Layer, type PathOptions } from 'leaflet';
import type { Feature, GeoJsonObject } from 'geojson';
import { ChevronDown } from 'lucide-react';
import {
  api,
  type MetricType,
  type DepartmentMapMarker,
  type DepartmentMapResponse,
} from '../lib/api';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Normaliza un string para matching robusto (quita acentos, minúsculas) */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/** Devuelve un color RGB interpolado entre azul claro y azul oscuro */
function getColor(value: number, min: number, max: number): string {
  const t = max === min ? 0.5 : (value - min) / (max - min);
  const r = Math.round(165 + (55  - 165) * t);
  const g = Math.round(180 + (48  - 180) * t);
  const b = Math.round(252 + (163 - 252) * t);
  return `rgb(${r},${g},${b})`;
}

function fmtVal(value: number | null, dataType: string): string {
  if (value === null) return '—';
  if (dataType === 'percentage') return `${(value * 100).toFixed(1)}%`;
  if (dataType === 'currency')   return `Q ${value.toLocaleString()}`;
  if (dataType === 'integer')    return value.toLocaleString();
  return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
}




// ── Componente auxiliar ───────────────────────────────────────────────────────

function FitBounds() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds([[13.7, -92.3], [17.8, -88.2]], { padding: [20, 20] });
  }, [map]);
  return null;
}

// ── Componente principal ──────────────────────────────────────────────────────

export function GeographicMap() {
  const [metricTypes,    setMetricTypes]    = useState<MetricType[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);
  const [mapData,        setMapData]        = useState<DepartmentMapMarker[]>([]);
  const [geojson,        setGeojson]        = useState<GeoJsonObject | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [loadingMap,     setLoadingMap]     = useState(false);
  const [error,          setError]          = useState('');

  // Carga el GeoJSON una sola vez
  useEffect(() => {
    fetch('/guatemala-departments.geojson')
      .then(r => r.json())
      .then(setGeojson)
      .catch(() => setError('No se pudo cargar la geometría de los departamentos.'));
  }, []);

  // Carga los tipos de métrica con datos reales
  useEffect(() => {
    api.get<MetricType[]>('/api/v1/public/metric-types?with_data=true')
      .then(types => {
        setMetricTypes(types);
        if (types.length > 0) setSelectedMetric(types[0]);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  // Carga datos del mapa cuando cambia la métrica seleccionada
  useEffect(() => {
    const params = selectedMetric ? `?metric_code=${selectedMetric.code}` : '';
    Promise.resolve().then(() => {
      setLoadingMap(true);
      api.get<DepartmentMapResponse>(`/api/v1/public/map/departments${params}`)
        .then(res => setMapData(res.departments))
        .catch(err => setError(err instanceof Error ? err.message : 'Error'))
        .finally(() => setLoadingMap(false));
    });
  }, [selectedMetric]);

  // Índice de datos por nombre normalizado
  const dataByName = new Map<string, DepartmentMapMarker>();
  mapData.forEach(d => dataByName.set(normalize(d.name), d));

  const values = mapData
    .map(d => d.metric_value)
    .filter((v): v is number => v !== null);
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 1;

  // Estilo de cada polígono
  const styleFeature = useCallback(
    (feature?: Feature): PathOptions => {
      const shapeName = feature?.properties?.shapeName ?? '';
      const dept = dataByName.get(normalize(shapeName));
      const val = dept?.metric_value ?? null;
      const fillColor = val !== null
        ? getColor(val, minVal, maxVal)
        : '#D1D5DB'; // gris para sin dato
      return {
        fillColor,
        fillOpacity: 0.82,
        color: '#FFFFFF',
        weight: 1.5,
        opacity: 1,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mapData, minVal, maxVal],
  );

  // Eventos hover + tooltip por polígono
  const onEachFeature = useCallback(
    (feature: Feature, layer: Layer) => {
      const shapeName = feature?.properties?.shapeName ?? '';
      const dept = dataByName.get(normalize(shapeName));

      const pathLayer = layer as L.Path;

      // Highlight on hover
      pathLayer.on('mouseover', (e) => {
        (e.target as L.Path).setStyle({
          weight: 3,
          color: '#6366F1',
          fillOpacity: 0.95,
        });
        (e.target as L.Path).bringToFront();
      });

      pathLayer.on('mouseout', (e) => {
        (e.target as L.Path).setStyle(styleFeature(feature));
      });

      // Tooltip oscuro
      const name      = dept?.name      ?? shapeName;
      const capital   = dept?.capital   ?? null;
      const pop       = dept?.population ?? null;
      const metricVal = dept?.metric_value ?? null;

      const metricLine = selectedMetric
        ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#9CA3AF;margin-top:3px;">
             <span>${selectedMetric.name}</span>
             <span style="color:#6EE7B7;font-weight:600;margin-left:12px;">${fmtVal(metricVal, selectedMetric.data_type)}</span>
           </div>`
        : '';

      const capitalLine = capital
        ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#9CA3AF;margin-bottom:2px;">
             <span>Capital</span>
             <span style="color:#E5E7EB;font-weight:500;margin-left:12px;">${capital}</span>
           </div>`
        : '';

      const popLine = pop != null
        ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#9CA3AF;margin-bottom:2px;">
             <span>Población</span>
             <span style="color:#a5b4fc;font-weight:600;margin-left:12px;">${pop.toLocaleString()}</span>
           </div>`
        : '';

      pathLayer.bindTooltip(
        `<div style="background:#111827;color:#fff;border-radius:8px;padding:10px 14px;min-width:175px;font-family:Inter,system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.3);">
           <div style="font-weight:700;font-size:13px;margin-bottom:6px;">${name}</div>
           ${capitalLine}${popLine}${metricLine}
         </div>`,
        {
          sticky: false,
          direction: 'top',
          opacity: 1,
          className: 'geo-tooltip',
        },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mapData, selectedMetric],
  );

  // Key fuerza re-render del GeoJSON cuando cambian los datos o la métrica
  const geojsonKey = `${selectedMetric?.code ?? 'none'}-${mapData.length}-${minVal}-${maxVal}`;

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Suprimir estilos del tooltip de Leaflet para usar los nuestros */}
      <style>{`
        .geo-tooltip {
          padding: 0 !important;
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .geo-tooltip::before { display: none !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>
            Mapa Geográfico
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            Visualización coroplética de datos por departamento
          </p>
        </div>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select
            value={selectedMetric?.code ?? ''}
            onChange={e => setSelectedMetric(metricTypes.find(m => m.code === e.target.value) ?? null)}
            disabled={loading}
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
              minWidth: '220px',
            }}
          >
            {loading && <option>Cargando...</option>}
            {metricTypes.map(m => (
              <option key={m.code} value={m.code}>{m.name}</option>
            ))}
          </select>
          <ChevronDown
            size={15}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '12px' }}>{error}</p>
      )}

      {/* Mapa */}
      <div style={{ height: '480px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', position: 'relative', marginBottom: '16px' }}>
        {loadingMap && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '14px', color: '#6B7280' }}>Cargando datos...</span>
          </div>
        )}

        <MapContainer
          center={[15.5, -90.3]}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          zoomControl
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds />

          {geojson && (
            <GeoJSON
              key={geojsonKey}
              data={geojson}
              style={styleFeature}
              onEachFeature={onEachFeature}
            />
          )}
        </MapContainer>

        {/* Leyenda */}
        <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1000, background: '#FFFFFF', borderRadius: '8px', padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', minWidth: '160px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
            {selectedMetric?.name ?? 'Métrica'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#6B7280' }}>Bajo</span>
            <div style={{ flex: 1, height: '10px', borderRadius: '4px', background: 'linear-gradient(to right, #a5b4fc, #3730a3)', border: '1px solid #E5E7EB' }} />
            <span style={{ fontSize: '11px', color: '#6B7280' }}>Alto</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: '#D1D5DB', border: '1px solid #E5E7EB', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#6B7280' }}>Sin datos</span>
          </div>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        {[
          { label: 'Total departamentos',  value: String(mapData.length || '—') },
          { label: 'Con datos de métrica', value: String(values.length || '—') },
          { label: 'Métrica seleccionada', value: selectedMetric?.name ?? '—', small: true },
        ].map(({ label, value, small }) => (
          <div key={label} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '20px 24px' }}>
            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontSize: small ? '18px' : '34px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
