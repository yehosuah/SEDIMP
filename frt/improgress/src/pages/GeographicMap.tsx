import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ChevronDown } from 'lucide-react';
import { api, type MetricType, type DepartmentMapMarker, type DepartmentMapResponse } from '../lib/api';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

// Coordenadas de los 22 departamentos de Guatemala (fallback cuando el back no las tiene)
const DEPT_COORDS: Record<string, { lat: number; lng: number; capital: string }> = {
  '01': { lat: 14.6349, lng: -90.5069, capital: 'Ciudad de Guatemala' },
  '02': { lat: 14.8613, lng: -90.0694, capital: 'Guastatoya' },
  '03': { lat: 14.9000, lng: -89.8700, capital: 'Chiquimula' },  // Sacatepéquez override below
  '04': { lat: 14.6607, lng: -90.8200, capital: 'Chimaltenango' },
  '05': { lat: 14.3042, lng: -90.7858, capital: 'Escuintla' },
  '06': { lat: 14.5586, lng: -90.7295, capital: 'Antigua Guatemala' },
  '07': { lat: 14.9667, lng: -91.7833, capital: 'San Marcos' },
  '08': { lat: 14.5303, lng: -91.5021, capital: 'Mazatenango' },
  '09': { lat: 14.8335, lng: -91.5188, capital: 'Quetzaltenango' },
  '10': { lat: 14.9085, lng: -91.3584, capital: 'Totonicapán' },
  '11': { lat: 14.5308, lng: -91.6769, capital: 'Retalhuleu' },
  '12': { lat: 14.5000, lng: -91.2300, capital: 'Cuilapa' },
  '13': { lat: 15.3194, lng: -91.4724, capital: 'Huehuetenango' },
  '14': { lat: 15.0300, lng: -91.1500, capital: 'Santa Cruz del Quiché' },
  '15': { lat: 15.1025, lng: -90.3153, capital: 'Salamá' },
  '16': { lat: 15.4701, lng: -90.3794, capital: 'Cobán' },
  '17': { lat: 16.9311, lng: -89.8930, capital: 'Flores' },
  '18': { lat: 15.7226, lng: -88.5937, capital: 'Puerto Barrios' },
  '19': { lat: 15.0000, lng: -89.5000, capital: 'Zacapa' },
  '20': { lat: 14.7989, lng: -89.5453, capital: 'Chiquimula' },
  '21': { lat: 14.6333, lng: -89.9833, capital: 'Jalapa' },
  '22': { lat: 14.2932, lng: -89.8956, capital: 'Jutiapa' },
};


function getColor(value: number, min: number, max: number) {
  const t = max === min ? 0.5 : (value - min) / (max - min);
  return `rgb(${Math.round(165+(55-165)*t)},${Math.round(180+(48-180)*t)},${Math.round(252+(163-252)*t)})`;
}

function createDotIcon(color: string, size = 14) {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:${size}px;height:${size}px;"><div style="width:${size}px;height:${size}px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35);cursor:pointer;"></div></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size],
  });
}

function FitBounds() {
  const map = useMap();
  useEffect(() => { map.fitBounds([[13.7,-92.3],[17.8,-88.2]], { padding:[20,20] }); }, [map]);
  return null;
}

function fmtVal(value: number | null, dataType: string): string {
  if (value === null) return '—';
  if (dataType === 'percentage') return `${(value*100).toFixed(1)}%`;
  if (dataType === 'currency') return `Q ${value.toLocaleString()}`;
  if (dataType === 'integer') return value.toLocaleString();
  return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

export function GeographicMap() {
  const [metricTypes, setMetricTypes] = useState<MetricType[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);
  const [mapData, setMapData] = useState<DepartmentMapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMap, setLoadingMap] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<MetricType[]>('/api/v1/public/metric-types')
      .then(types => { setMetricTypes(types); if (types.length > 0) setSelectedMetric(types[0]); })
      .catch(err => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = selectedMetric ? `?metric_code=${selectedMetric.code}` : '';
    setLoadingMap(true);
    api.get<DepartmentMapResponse>(`/api/v1/public/map/departments${params}`)
      .then(res => setMapData(res.departments))
      .catch(err => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setLoadingMap(false));
  }, [selectedMetric]);

  const values = mapData.map(d => d.metric_value).filter((v): v is number => v !== null);
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 1;

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`.leaflet-tooltip{padding:0!important;border:none!important;background:transparent!important;box-shadow:none!important;}.leaflet-tooltip::before{display:none!important;}`}</style>

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px', gap:'16px' }}>
        <div>
          <h1 style={{ fontSize:'26px', fontWeight:700, color:'#111827', margin:'0 0 4px 0' }}>Geographic Map</h1>
          <p style={{ fontSize:'14px', color:'#6B7280', margin:0 }}>Visualización geográfica de datos municipales</p>
        </div>
        <div style={{ position:'relative', flexShrink:0 }}>
          <select
            value={selectedMetric?.code ?? ''}
            onChange={e => setSelectedMetric(metricTypes.find(m => m.code === e.target.value) ?? null)}
            disabled={loading}
            style={{ appearance:'none', height:'40px', padding:'0 36px 0 14px', border:'1px solid #E5E7EB', borderRadius:'8px', fontSize:'14px', color:'#111827', background:'#FFFFFF', outline:'none', cursor:'pointer', minWidth:'200px' }}
          >
            {loading && <option>Cargando...</option>}
            {metricTypes.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
          </select>
          <ChevronDown size={15} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:'#6B7280', pointerEvents:'none' }} />
        </div>
      </div>

      {error && <p style={{ color:'#DC2626', fontSize:'13px', marginBottom:'12px' }}>{error}</p>}

      <div style={{ height:'460px', borderRadius:'12px', overflow:'hidden', border:'1px solid #E5E7EB', position:'relative', marginBottom:'16px' }}>
        {loadingMap && (
          <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.7)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:'14px', color:'#6B7280' }}>Cargando datos...</span>
          </div>
        )}
        <MapContainer center={[15.5,-90.3]} zoom={7} style={{ height:'100%', width:'100%' }} zoomControl scrollWheelZoom>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitBounds />
          {mapData.map(dept => {
            const fallback = DEPT_COORDS[dept.code];
            const lat = dept.latitude ?? fallback?.lat;
            const lng = dept.longitude ?? fallback?.lng;
            const capital = dept.capital ?? fallback?.capital ?? null;
            if (lat == null || lng == null) return null;
            const color = dept.metric_value !== null ? getColor(dept.metric_value, minVal, maxVal) : 'rgb(209,213,219)';
            const isCapital = dept.code === '01';
            return (
              <Marker key={dept.code} position={[lat, lng]}
                icon={createDotIcon(color, isCapital ? 18 : 14)}
                eventHandlers={{
                  mouseover: e => e.target.setIcon(createDotIcon(color, isCapital ? 24 : 20)),
                  mouseout:  e => e.target.setIcon(createDotIcon(color, isCapital ? 18 : 14)),
                }}
              >
                <Tooltip direction="top" offset={[0,-8]} opacity={1}>
                  <div style={{ background:'#111827', color:'#fff', borderRadius:'8px', padding:'10px 14px', minWidth:'170px', fontFamily:'Inter,system-ui,sans-serif', boxShadow:'0 4px 16px rgba(0,0,0,0.25)' }}>
                    <div style={{ fontWeight:700, fontSize:'13px', marginBottom:'6px' }}>{dept.name}</div>
                    {capital && (
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#9CA3AF', marginBottom:'3px' }}>
                        <span>Capital</span><span style={{ color:'#E5E7EB', fontWeight:500 }}>{capital}</span>
                      </div>
                    )}
                    {dept.population && (
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#9CA3AF', marginBottom:'3px' }}>
                        <span>Población</span><span style={{ color:'#a5b4fc', fontWeight:600 }}>{dept.population.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedMetric && (
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#9CA3AF' }}>
                        <span>{selectedMetric.name}</span>
                        <span style={{ color:'#6EE7B7', fontWeight:600 }}>{fmtVal(dept.metric_value, selectedMetric.data_type)}</span>
                      </div>
                    )}
                  </div>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>
        <div style={{ position:'absolute', bottom:20, left:20, zIndex:1000, background:'#FFFFFF', borderRadius:'8px', padding:'10px 14px', boxShadow:'0 2px 8px rgba(0,0,0,0.12)', minWidth:'140px' }}>
          <div style={{ fontSize:'12px', fontWeight:600, color:'#111827', marginBottom:'6px' }}>{selectedMetric?.name ?? 'Métrica'}</div>
          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <span style={{ fontSize:'11px', color:'#6B7280' }}>Low</span>
            <div style={{ flex:1, height:'10px', borderRadius:'4px', background:'linear-gradient(to right, #a5b4fc, #3730a3)', border:'1px solid #E5E7EB' }} />
            <span style={{ fontSize:'11px', color:'#6B7280' }}>High</span>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px' }}>
        {[
          { label:'Total Departments',  value: String(mapData.length || '—') },
          { label:'With metric data',   value: String(values.length || '—') },
          { label:'Selected metric',    value: selectedMetric?.name ?? '—', small: true },
        ].map(({ label, value, small }) => (
          <div key={label} style={{ background:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'20px 24px' }}>
            <div style={{ fontSize:'13px', color:'#6B7280', marginBottom:'8px' }}>{label}</div>
            <div style={{ fontSize: small ? '18px' : '34px', fontWeight:700, color:'#111827', lineHeight:1.2 }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
