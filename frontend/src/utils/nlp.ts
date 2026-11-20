import type {
  HealthResponse,
  InventoryMap,
  TargetSpanMatch,
} from '../types/contexta';

/**
 * Dynamically computes inventory statistics from the loaded inventory map.
 * Never relies on hardcoded lemma counts.
 */
export function getInventoryStats(
  inventory: InventoryMap,
  neuralSupportedWords: readonly string[],
) {
  const lemmas = Object.keys(inventory);
  const neuralSet = new Set(neuralSupportedWords.map((w) => w.toLowerCase()));
  let neuralCount = 0;
  let totalSenses = 0;

  for (const lemma of lemmas) {
    if (neuralSet.has(lemma.toLowerCase())) {
      neuralCount += 1;
    }
    totalSenses += inventory[lemma]?.senses?.length ?? 0;
  }

  return {
    totalWords: lemmas.length,
    totalSenses,
    neuralCount,
    ruleOnlyCount: lemmas.length - neuralCount,
  };
}

/**
 * Mirrors the Python backend & Streamlit whole-word target span detector
 * (`re.finditer(r'\b[\w]+\b', text, re.UNICODE)` filtered against inventory keys).
 */
export function detectInventorySpans(
  text: string,
  inventory: InventoryMap,
): TargetSpanMatch[] {
  if (!text) return [];
  const matches: TargetSpanMatch[] = [];
  const regex = /[\p{L}\p{N}_]+/gu;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const surface = match[0];
    const normalized = surface.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(inventory, normalized)) {
      matches.push({
        word: normalized,
        surface,
        start: match.index,
        end: match.index + surface.length,
      });
    }
  }

  return matches;
}

export interface TextSegment {
  text: string;
  spanIndex: number | null;
  match?: TargetSpanMatch;
}

/**
 * Splits a sentence into plain text chunks and clickable target-span tokens
 * for inline highlighting in WSD & Comparison labs.
 */
export function buildHighlightedSegments(
  text: string,
  spans: TargetSpanMatch[],
): TextSegment[] {
  if (!text) return [];
  if (spans.length === 0) {
    return [{ text, spanIndex: null }];
  }

  const segments: TextSegment[] = [];
  let cursor = 0;

  spans.forEach((span, idx) => {
    if (span.start > cursor) {
      segments.push({
        text: text.slice(cursor, span.start),
        spanIndex: null,
      });
    }
    segments.push({
      text: text.slice(span.start, span.end),
      spanIndex: idx,
      match: span,
    });
    cursor = span.end;
  });

  if (cursor < text.length) {
    segments.push({
      text: text.slice(cursor),
      spanIndex: null,
    });
  }

  return segments;
}

/**
 * Strictly validates that a /api/health response belongs to the Contexta/SenseForge
 * FastAPI backend (preventing false-positive online status from unrelated proxies).
 */
export function isValidHealthResponse(data: unknown): data is HealthResponse {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    obj.status === 'ok' &&
    typeof obj.inventory_words === 'number' &&
    typeof obj.neural_checkpoint === 'boolean' &&
    typeof obj.models === 'object' &&
    obj.models !== null
  );
}

export interface ParsedCsvResult {
  headers: string[];
  rows: Array<Record<string, string>>;
  error?: string;
}

/**
 * RFC-4180 compliant CSV parser for client-side batch preview & validation.
 * Strips UTF-8 BOM, validates presence of `text` column and row bounds.
 */
export function parseCsvText(
  rawText: string,
  maxRows = 250,
): ParsedCsvResult {
  const clean = rawText.replace(/^\uFEFF/, '');
  if (!clean.trim()) {
    return { headers: [], rows: [], error: 'CSV file is empty.' };
  }

  const records: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\r' && next === '\n') {
      row.push(field);
      records.push(row);
      row = [];
      field = '';
      i += 1;
    } else if (ch === '\n' || ch === '\r') {
      row.push(field);
      records.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }

  if (inQuotes) {
    return { headers: [], rows: [], error: 'Malformed CSV: unterminated quoted field.' };
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    records.push(row);
  }

  const nonEmpty = records.filter((r) => r.some((cell) => cell.trim() !== ''));
  if (nonEmpty.length < 2) {
    return {
      headers: nonEmpty[0] ?? [],
      rows: [],
      error: 'CSV must contain a header row and at least one data row.',
    };
  }

  const headers = nonEmpty[0].map((h) => h.trim());
  if (!headers.includes('text')) {
    return {
      headers,
      rows: [],
      error: 'CSV requires a "text" column (and optional "word" column).',
    };
  }

  const dataRows = nonEmpty.slice(1);
  if (dataRows.length > maxRows) {
    return {
      headers,
      rows: [],
      error: `CSV contains ${dataRows.length} rows, exceeding the ${maxRows}-row limit for this mode.`,
    };
  }

  const mapped = dataRows.map((cells) => {
    const entry: Record<string, string> = {};
    headers.forEach((h, idx) => {
      entry[h] = (cells[idx] ?? '').trim();
    });
    return entry;
  });

  return { headers, rows: mapped };
}

/**
 * Serializes tabular batch results into a safely escaped UTF-8 CSV string.
 */
export function serializeCsv(
  rows: Array<Record<string, unknown>>,
  columns?: string[],
): string {
  if (rows.length === 0) return '';
  const cols =
    columns ??
    Array.from(
      rows.reduce((set, row) => {
        Object.keys(row).forEach((k) => set.add(k));
        return set;
      }, new Set<string>()),
    );

  const escapeCell = (val: unknown) => {
    const str = val === null || val === undefined ? '' : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  return [
    cols.map(escapeCell).join(','),
    ...rows.map((r) => cols.map((c) => escapeCell(r[c])).join(',')),
  ].join('\n');
}

export function formatPercent(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatMetric(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toFixed(digits);
}

export function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}
