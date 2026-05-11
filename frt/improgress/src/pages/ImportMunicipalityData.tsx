import { useState, useRef } from 'react';
import { ChevronDown, Upload, FileText, Check } from 'lucide-react';

interface DataField {
  field: string;
  sample: string;
  type: 'integer' | 'percentage' | 'string';
  mapped: string;
}

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

const dataFields: DataField[] = [
  { field: 'pob_total', sample: '923392, 80582', type: 'integer', mapped: 'Población Total (exact)' },
  { field: 'pob_hombres', sample: '438695, 38174', type: 'integer', mapped: 'Población Hombres (exact)' },
  { field: 'pob_mujeres', sample: '484697, 42408', type: 'integer', mapped: 'Población mujeres (exact)' },
  { field: 'idhm_2018', sample: '0.792, 0.773', type: 'percentage', mapped: '' },
  { field: 'ipm', sample: '0.089, 0.136', type: 'percentage', mapped: 'Índice de Pobreza Multidimensional (exact)' },
];

const metricOptions: string[] = [
  'Población Total (exact)',
  'Población Hombres (exact)',
  'Población mujeres (exact)',
  'Índice de Pobreza Multidimensional (exact)',
  'IDH Municipal 2018',
];

const TypeBadge = ({ type }: { type: string }) => {
  const styles: Record<string, { background: string; color: string }> = {
    integer: { background: '#DBEAFE', color: '#1D4ED8' },
    percentage: { background: '#FEF3C7', color: '#92400E' },
    string: { background: '#F3F4F6', color: '#6B7280' },
  };
  const s = styles[type] || styles.string;
  return (
    <span style={{ ...s, padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>
      {type}
    </span>
  );
};

const SelectField = ({
  options,
  value,
  onChange,
  placeholder = 'Select field...',
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <div style={{ position: 'relative', width: '100%' }}>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        appearance: 'none', width: '100%', border: '1px solid #E5E7EB',
        borderRadius: '8px', height: '44px', padding: '0 36px 0 14px',
        fontSize: '14px', color: value ? '#111827' : '#9CA3AF',
        background: '#fff', outline: 'none', cursor: 'pointer',
      }}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <ChevronDown size={15} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }} />
  </div>
);

// ─── STEP 1 ───────────────────────────────────────────────────────────────────
function Step1({ onNext }: StepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | undefined) => {
    if (f && f.name.endsWith('.json')) setFile(f);
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        style={{
          border: `2px dashed ${dragging ? '#6366F1' : '#D1D5DB'}`,
          borderRadius: '12px', padding: '56px 24px', textAlign: 'center',
          background: dragging ? '#EEF2FF' : '#FAFAFA', cursor: 'pointer', transition: 'all .2s',
        }}
      >
        <Upload size={36} style={{ margin: '0 auto 12px', display: 'block', color: dragging ? '#6366F1' : '#9CA3AF' }} />
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>
          Arrastra tu archivo JSON aquí
        </p>
        <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0 0 16px' }}>
          o haz clic para seleccionar
        </p>
        <button
          style={{ background: '#6366F1', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
        >
          Seleccionar archivo
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files?.[0])}
        />
      </div>

      {file && (
        <div style={{ marginTop: 16, background: '#EEF2FF', borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={18} style={{ color: '#6366F1', flexShrink: 0 }} />
          <span style={{ fontSize: 14, color: '#6366F1', fontWeight: 600 }}>{file.name}</span>
          <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 'auto' }}>{(file.size / 1024).toFixed(1)} KB</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <button onClick={onNext} style={{ background: '#6366F1', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          Siguiente →
        </button>
      </div>
    </div>
  );
}

// ─── STEP 2 ───────────────────────────────────────────────────────────────────
function Step2({ onNext, onBack }: StepProps) {
  const [municipio, setMunicipio] = useState('');
  const [depto, setDepto] = useState('');
  const [mappings, setMappings] = useState<Record<string, string>>(
    Object.fromEntries(dataFields.map(f => [f.field, f.mapped]))
  );

  const setMapping = (field: string, val: string) => setMappings(prev => ({ ...prev, [field]: val }));
  const clearMapping = (field: string) => setMappings(prev => ({ ...prev, [field]: '' }));

  return (
    <div>
      <div style={{ background: '#EEF2FF', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#6366F1', margin: '0 0 10px' }}>Data Analysis</p>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {['Total Municipalities: 2', 'Total Fields: 9', 'Metric Fields: 5', 'Sample Data: 2 records'].map(s => (
            <span key={s} style={{ fontSize: 13, color: '#6366F1', textDecoration: 'underline', cursor: 'pointer' }}>{s}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Municipality Identifier</label>
          <SelectField options={['municipio', 'municipio_id']} value={municipio} onChange={setMunicipio} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Department Identifier</label>
          <SelectField options={['departamento', 'dept_id']} value={depto} onChange={setDepto} />
        </div>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: '0 0 14px' }}>Map Data Fields to Metric Types</h3>

      <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              {['Data Field', 'Sample Values', 'Detected Type', 'Map to Metric Type', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataFields.map((f, i) => (
              <tr key={f.field} style={{ borderBottom: i < dataFields.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600 }}>{f.field}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>{f.sample}</td>
                <td style={{ padding: '12px 16px' }}><TypeBadge type={f.type} /></td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={mappings[f.field]}
                      onChange={e => setMapping(f.field, e.target.value)}
                      style={{ appearance: 'none', border: '1px solid #D1D5DB', borderRadius: 6, height: 34, padding: '0 28px 0 10px', fontSize: 13, minWidth: 200, background: '#fff', cursor: 'pointer', outline: 'none' }}
                    >
                      <option value="">Select metric type...</option>
                      {metricOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }} />
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => clearMapping(f.field)} style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                    Clear
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <button onClick={onBack} style={{ background: '#fff', border: '1px solid #D1D5DB', color: '#374151', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← Atrás</button>
        <button onClick={onNext} style={{ background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Siguiente →</button>
      </div>
    </div>
  );
}

// ─── STEP 3 ───────────────────────────────────────────────────────────────────
function Step3({ onBack }: { onBack: () => void }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [progress, setProgress] = useState(0);

  const runImport = () => {
    setStatus('loading');
    setProgress(0);
    const iv = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 18;
        if (next >= 100) { clearInterval(iv); setStatus('done'); return 100; }
        return next;
      });
    }, 200);
  };

  return (
    <div>
      {status !== 'done' && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#166534', margin: '0 0 6px' }}>✓ Listo para importar</p>
          <p style={{ fontSize: 13, color: '#15803D', margin: 0 }}>Se procesarán 2 municipios con 5 campos de métricas mapeados.</p>
        </div>
      )}

      <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', background: '#fff', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.5px' }}>Resumen</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.5px' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {([
              ['Total de municipios', '2'],
              ['Campos mapeados', '5 de 9'],
              ['Tipos de datos', 'integer (3), percentage (2)'],
              ['Estado', status === 'done' ? '✓ Completado' : 'Pendiente'],
            ] as [string, string][]).map(([k, v], i, arr) => (
              <tr key={k} style={{ borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <td style={{ padding: '12px 16px', fontSize: 14, color: '#6B7280' }}>{k}</td>
                <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: status === 'done' && k === 'Estado' ? '#16A34A' : '#111827' }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {status === 'loading' && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 8px' }}>Importando... {Math.round(progress)}%</p>
          <div style={{ background: '#E5E7EB', borderRadius: 999, height: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#6366F1', width: `${progress}%`, borderRadius: 999, transition: 'width .2s' }} />
          </div>
        </div>
      )}

      {status === 'done' && (
        <div style={{ background: '#EEF2FF', borderRadius: 10, padding: 20, textAlign: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#6366F1', margin: '0 0 4px' }}>¡Importación completada!</p>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Los datos han sido procesados correctamente.</p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <button onClick={onBack} disabled={status === 'loading'} style={{ background: '#fff', border: '1px solid #D1D5DB', color: '#374151', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: status === 'loading' ? .5 : 1 }}>
          ← Atrás
        </button>
        {status !== 'done' && (
          <button onClick={runImport} disabled={status === 'loading'} style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: status === 'loading' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: status === 'loading' ? .7 : 1 }}>
            {status === 'loading' && (
              <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
            )}
            {status === 'loading' ? 'Importando...' : 'Iniciar Importación'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── STEPPER ──────────────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  const steps = ['Upload File', 'Configure Mapping', 'Process & Import'];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 32 }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: done || active ? '#6366F1' : '#E5E7EB', color: done || active ? '#fff' : '#9CA3AF', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {done ? <Check size={18} /> : n}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: done || active ? '#6366F1' : '#9CA3AF', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 80, height: 3, background: n < current ? '#6366F1' : '#D1D5DB', marginTop: 18, flexShrink: 0 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN — exportado de ambas formas ────────────────────────────────────────
export function ImportMunicipalityData() {
  const [step, setStep] = useState(1);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#111827' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px' }}>Import Municipality Metric Data</h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Upload JSON data containing metric values for municipalities</p>
        </div>
        <button style={{ background: '#fff', border: '1px solid #D1D5DB', color: '#374151', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          DOWNLOAD TEMPLATE
        </button>
      </div>

      <StepIndicator current={step} />

      {step === 1 && <Step1 onNext={() => setStep(2)} />}
      {step === 2 && <Step2 onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <Step3 onBack={() => setStep(2)} />}
    </div>
  );
}

export default ImportMunicipalityData;