import type {
  AnnotationPayload,
  AnnotationsResponse,
  BatchResultRow,
  CandidatesResponse,
  CompareResponse,
  HealthResponse,
  InventoryMap,
  LidResponse,
  LiveDatasetsResponse,
  PredictRequest,
  PredictResponse,
  TranslateResponse,
} from '../types/contexta';
import { isValidHealthResponse, normalizeBaseUrl } from '../utils/nlp';

export class ApiError extends Error {
  status: number;
  offline: boolean;

  constructor(message: string, status = 0, offline = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.offline = offline;
  }
}

function buildUrl(baseUrl: string, path: string): string {
  const cleanBase = normalizeBaseUrl(baseUrl);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return cleanBase ? `${cleanBase}${cleanPath}` : cleanPath;
}

async function parseErrorDetail(res: Response): Promise<{ detail: string; offline: boolean }> {
  const body = await res.json().catch(() => null);
  if (body && typeof body === 'object') {
    const rec = body as Record<string, unknown>;
    const detail =
      typeof rec.detail === 'string'
        ? rec.detail
        : typeof rec.message === 'string'
          ? rec.message
          : `Backend request failed (HTTP ${res.status})`;
    return {
      detail,
      offline: Boolean(rec.backend_offline) || res.status === 502 || res.status === 503,
    };
  }
  return {
    detail:
      res.status === 401 || res.status === 502 || res.status === 503
        ? 'Local FastAPI backend (127.0.0.1:8000) is not reachable from this preview environment.'
        : `Backend request failed (HTTP ${res.status})`,
    offline: res.status === 401 || res.status === 502 || res.status === 503,
  };
}

async function requestJson<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = buildUrl(baseUrl, path);
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError(
      'Unable to reach FastAPI server. Start the local backend at 127.0.0.1:8000 to run live inference.',
      0,
      true,
    );
  }

  if (!res.ok) {
    const { detail, offline } = await parseErrorDetail(res);
    throw new ApiError(detail, res.status, offline);
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError('Unexpected non-JSON response from backend.', res.status, false);
  }
}

export async function fetchHealth(baseUrl = ''): Promise<HealthResponse> {
  const data = await requestJson<unknown>(baseUrl, '/api/health');
  if (!isValidHealthResponse(data)) {
    throw new ApiError(
      'Endpoint did not return a valid Contexta FastAPI health schema.',
      502,
      true,
    );
  }
  return data;
}

export async function fetchInventory(baseUrl = ''): Promise<InventoryMap> {
  const data = await requestJson<unknown>(baseUrl, '/api/inventory');
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ApiError('Invalid inventory schema returned by backend.', 502, false);
  }
  return data as InventoryMap;
}

export async function fetchDetectedWords(
  text: string,
  baseUrl = '',
): Promise<{ words: string[] }> {
  const qs = new URLSearchParams({ text }).toString();
  return requestJson<{ words: string[] }>(baseUrl, `/api/detect?${qs}`);
}

export async function predictSense(
  payload: PredictRequest,
  baseUrl = '',
): Promise<PredictResponse> {
  return requestJson<PredictResponse>(baseUrl, '/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function compareModels(
  payload: PredictRequest,
  baseUrl = '',
): Promise<CompareResponse> {
  return requestJson<CompareResponse>(baseUrl, '/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function identifyLanguages(
  text: string,
  baseUrl = '',
): Promise<LidResponse> {
  return requestJson<LidResponse>(baseUrl, '/api/lid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

export async function translateEnHi(
  text: string,
  baseUrl = '',
): Promise<TranslateResponse> {
  return requestJson<TranslateResponse>(baseUrl, '/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

export async function fetchDatasets(baseUrl = ''): Promise<LiveDatasetsResponse> {
  return requestJson<LiveDatasetsResponse>(baseUrl, '/api/datasets');
}

export async function fetchExperiments(
  baseUrl = '',
): Promise<Record<string, unknown>> {
  return requestJson<Record<string, unknown>>(baseUrl, '/api/experiments');
}

export async function fetchCandidates(
  offset = 0,
  limit = 50,
  baseUrl = '',
): Promise<CandidatesResponse> {
  const qs = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  }).toString();
  return requestJson<CandidatesResponse>(baseUrl, `/api/candidates?${qs}`);
}

export async function fetchAnnotations(
  baseUrl = '',
): Promise<AnnotationsResponse> {
  return requestJson<AnnotationsResponse>(baseUrl, '/api/annotations');
}

export async function saveAnnotation(
  payload: AnnotationPayload,
  baseUrl = '',
): Promise<{ saved: boolean }> {
  return requestJson<{ saved: boolean }>(baseUrl, '/api/annotations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function uploadBatchCsv(
  file: File,
  baseUrl = '',
): Promise<{ rows: BatchResultRow[]; count: number }> {
  const form = new FormData();
  form.append('file', file);
  return requestJson<{ rows: BatchResultRow[]; count: number }>(
    baseUrl,
    '/api/batch',
    {
      method: 'POST',
      body: form,
    },
  );
}

export function triggerFileDownload(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
