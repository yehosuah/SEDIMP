import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ChevronDown } from 'lucide-react';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const metrics = [
  'Población Total',
  'Tasa de Alfabetización',
  'Cobertura de Agua',
  'PIB per Cápita',
  'Índice de Desarrollo Humano',
];

const departments = [
  { name: 'Alta Verapaz',   capital: 'Cobán',               lat: 15.4701, lng: -90.3794, pop: 1200000 },
  { name: 'Baja Verapaz',   capital: 'Salamá',              lat: 15.1025, lng: -90.3153, pop: 280000  },
  { name: 'Chimaltenango',  capital: 'Chimaltenango',       lat: 14.6607, lng: -90.8200, pop: 700000  },
  { name: 'Chiquimula',     capital: 'Chiquimula',          lat: 14.7989, lng: -89.5453, pop: 380000  },
  { name: 'El Progreso',    capital: 'Guastatoya',          lat: 14.8613, lng: -90.0694, pop: 160000  },
  { name: 'Escuintla',      capital: 'Escuintla',           lat: 14.3042, lng: -90.7858, pop: 800000  },
  { name: 'Guatemala',      capital: 'Ciudad de Guatemala', lat: 14.6349, lng: -90.5069, pop: 3500000 },
  { name: 'Huehuetenango',  capital: 'Huehuetenango',       lat: 15.3194, lng: -91.4724, pop: 1100000 },
  { name: 'Izabal',         capital: 'Puerto Barrios',      lat: 15.7226, lng: -88.5937, pop: 450000  },
  { name: 'Jalapa',         capital: 'Jalapa',              lat: 14.6333, lng: -89.9833, pop: 320000  },
  { name: 'Jutiapa',        capital: 'Jutiapa',             lat: 14.2932, lng: -89.8956, pop: 450000  },
  { name: 'Petén',          capital: 'Flores',              lat: 16.9311, lng: -89.8930, pop: 700000  },
  { name: 'Quetzaltenango', capital: 'Quetzaltenango',      lat: 14.8335, lng: -91.5188, pop: 900000  },
  { name: 'Quiché',         capital: 'Santa Cruz del Q.',   lat: 15.0300, lng: -91.1500, pop: 1000000 },
  { name: 'Retalhuleu',     capital: 'Retalhuleu',          lat: 14.5308, lng: -91.6769, pop: 320000  },
  { name: 'Sacatepéquez',   capital: 'Antigua Guatemala',   lat: 14.5586, lng: -90.7295, pop: 330000  },
  { name: 'San Marcos',     capital: 'San Marcos',          lat: 14.9667, lng: -91.7833, pop: 1000000 },
  { name: 'Santa Rosa',     capital: 'Cuilapa',             lat: 14.2788, lng: -90.2977, pop: 360000  },
  { name: 'Sololá',         capital: 'Sololá',              lat: 14.7761, lng: -91.1828, pop: 440000  },
  { name: 'Suchitepéquez',  capital: 'Mazatenango',         lat: 14.5303, lng: -91.5021, pop: 560000  },
  { name: 'Totonicapán',    capital: 'Totonicapán',         lat: 14.9085, lng: -91.3584, pop: 490000  },
  { name: 'Zacapa',         capital: 'Zacapa',              lat: 14.9709, lng: -89.5269, pop: 230000  },
];

function getMarkerColor(pop: number) {
  const min = 160000, max = 3500000;
  const t = (pop - min) / (max - min);
  const r = Math.round(165 + (55  - 165) * t);
  const g = Math.round(180 + (48  - 180) * t);
  const b = Math.round(252 + (163 - 252) * t);
  return `rgb(${r},${g},${b})`;
}

function createDotIcon(color: string, size = 14) {
  const pulse = size > 14;
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${pulse ? `<div style="
          position:absolute;inset:-6px;
          border-radius:50%;
          background:${color}33;
          animation:ping 1s ease-out infinite;
        "></div>` : ''}
        <div style="
          width:${size}px;height:${size}px;
          background:${color};
          border:2.5px solid white;
          border-radius:50%;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
          transition:transform 0.15s ease;
          cursor:pointer;
        "></div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size],
  });
}

function FitBounds() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds([[13.7, -92.3], [17.8, -88.2]], { padding: [20, 20] });
  }, [map]);
  return null;
}

export function GeographicMap() {
  const [selectedMetric, setSelectedMetric] = useState('Población Total');

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* CSS for ping animation */}
      <style>{`
        @keyframes ping {
          0%   { transform: scale(1); opacity: 0.6; }
          80%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .leaflet-tooltip {
          padding: 0 !important;
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .leaflet-tooltip::before { display: none !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>
            Geographic Map
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            Visualización geográfica de datos municipales
          </p>
        </div>

        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select
            value={selectedMetric}
            onChange={e => setSelectedMetric(e.target.value)}
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
              minWidth: '200px',
            }}
          >
            {metrics.map(m => <option key={m}>{m}</option>)}
          </select>
          <ChevronDown size={15} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* ── Map ── */}
      <div style={{ height: '460px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', position: 'relative', marginBottom: '16px' }}>
        <MapContainer center={[15.5, -90.3]} zoom={7} style={{ height: '100%', width: '100%' }} zoomControl scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds />

          {departments.map(dept => {
            const color = getMarkerColor(dept.pop);
            const isCapital = dept.name === 'Guatemala';
            return (
              <Marker
                key={dept.name}
                position={[dept.lat, dept.lng]}
                icon={createDotIcon(color, isCapital ? 18 : 14)}
                eventHandlers={{
                  mouseover: e => {
                    e.target.setIcon(createDotIcon(color, isCapital ? 24 : 20));
                  },
                  mouseout: e => {
                    e.target.setIcon(createDotIcon(color, isCapital ? 18 : 14));
                  },
                }}
              >
                {/* Hover tooltip — styled card */}
                <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                  <div style={{
                    background: '#111827',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    minWidth: '170px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', color: '#fff' }}>
                      {dept.name}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9CA3AF', marginBottom: '3px' }}>
                      <span>Capital</span>
                      <span style={{ color: '#E5E7EB', fontWeight: 500 }}>{dept.capital}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9CA3AF' }}>
                      <span>Población</span>
                      <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{dept.pop.toLocaleString()}</span>
                    </div>
                  </div>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Gradient legend */}
        <div style={{
          position: 'absolute', bottom: 20, left: 20, zIndex: 1000,
          background: '#FFFFFF', borderRadius: '8px', padding: '10px 14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)', minWidth: '140px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>Población</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#6B7280' }}>Low</span>
            <div style={{ flex: 1, height: '10px', borderRadius: '4px', background: 'linear-gradient(to right, #a5b4fc, #3730a3)', border: '1px solid #E5E7EB' }} />
            <span style={{ fontSize: '11px', color: '#6B7280' }}>High</span>
          </div>
        </div>
      </div>

      {/* ── 3 Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        {[
          { label: 'Total Departments',    value: '22' },
          { label: 'Municipalities mapped', value: '340' },
          { label: 'Selected metric',       value: selectedMetric, small: true },
        ].map(({ label, value, small }) => (
          <div key={label} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '20px 24px' }}>
            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontSize: small ? '18px' : '34px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
