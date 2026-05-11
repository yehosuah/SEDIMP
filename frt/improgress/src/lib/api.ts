const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';

// ── Types ────────────────────────────────────────────────────────────────────

export interface Department {
  code: string;
  name: string;
  capital: string | null;
  latitude: number | null;
  longitude: number | null;
  population: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MetricTypeCategory {
  id: string;
  name: string;
  is_active: boolean;
  metric_type_count: number;
  created_at: string;
  updated_at: string;
}

export interface MetricType {
  code: string;
  name: string;
  category_id: string;
  category_name: string;
  data_type: string;
  unit: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentMapMarker {
  code: string;
  name: string;
  capital: string | null;
  latitude: number | null;
  longitude: number | null;
  population: number | null;
  metric_code: string | null;
  metric_value: number | null;
}

export interface DepartmentMapResponse {
  metric_code: string | null;
  departments: DepartmentMapMarker[];
}

export interface ImportFieldAnalysis {
  field: string;
  sample_values: string[];
  detected_type: string;
  mapped_metric_code: string | null;
}

export interface MunicipalityDataAnalysis {
  total_records: number;
  total_fields: number;
  fields: ImportFieldAnalysis[];
}

export interface MunicipalityDataImportSummary {
  total_records: number;
  mapped_fields: number;
  metric_values: number;
  skipped_values: number;
}

export interface ImportTemplate {
  records: Record<string, unknown>[];
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: { id: string; email: string; is_manager: boolean; is_active: boolean };
}

// ── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body?.detail ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Public helpers ───────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
};
