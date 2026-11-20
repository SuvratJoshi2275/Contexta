export type ModuleId =
  | 'overview'
  | 'wsd'
  | 'lid'
  | 'translation'
  | 'comparison'
  | 'inventory'
  | 'datasets'
  | 'evaluation'
  | 'ablation'
  | 'batch'
  | 'annotation'
  | 'experiments';

export type NavGroup = 'Discover' | 'Live Inference Labs' | 'Research & Corpora';

export interface ModuleMeta {
  id: ModuleId;
  label: string;
  shortLabel: string;
  group: NavGroup;
  description: string;
  requiresBackend: boolean;
}

export interface SenseEntry {
  id: string;
  definition: string;
  hindi: string;
  cues: string[];
  priority: number;
}

export interface InventoryItem {
  lemma: string;
  pos: string;
  senses: SenseEntry[];
  default: string;
  provenance: string;
}

export type InventoryMap = Record<string, InventoryItem>;

export interface HealthResponse {
  status: string;
  inventory_words: number;
  neural_checkpoint: boolean;
  lid_checkpoint: boolean;
  translation_checkpoint: boolean;
  models: {
    wsd_lora: boolean;
    lid: boolean;
    translation: boolean;
  };
}

export type ConnectionStatus = 'checking' | 'online' | 'offline';

export interface TokenLanguage {
  token: string;
  language: string;
  start: number;
  end: number;
}

export interface SenseAlternative {
  id: string;
  hindi: string;
  definition: string;
  matched_cues: string[];
}

export type InferenceMethod = 'hybrid' | 'rule' | 'dictionary' | 'neural';

export interface PredictRequest {
  text: string;
  word: string | null;
  method?: InferenceMethod;
  target_char_start?: number | null;
  target_char_end?: number | null;
  include_translation?: boolean;
}

export interface PredictResponse {
  word: string;
  text?: string;
  target_surface?: string;
  target_span?: [number, number];
  sense_id: string | null;
  hindi: string | null;
  definition: string | null;
  confidence: number | null;
  method: string;
  status: string;
  evidence: string[];
  alternatives: SenseAlternative[];
  token_languages?: TokenLanguage[];
  translation_hi?: string | null;
  warnings?: string[];
}

export interface NeuralCompareEntry {
  sense_id: string;
  hindi: string;
  definition: string;
  confidence: number;
  method: string;
}

export interface CompareResponse {
  dictionary: PredictResponse;
  rule: PredictResponse;
  neural: NeuralCompareEntry | null;
  hybrid: PredictResponse;
  token_languages: TokenLanguage[];
  translation_hi: string | null;
  warnings: string[];
}

export interface LidResponse {
  text: string;
  tokens: TokenLanguage[];
  model: string;
}

export interface TranslateResponse {
  source_en: string;
  translation_hi: string;
  model: string;
  experimental: boolean;
}

export interface DatasetAuditEntry {
  available: boolean;
  path?: string;
  rows?: number | null;
  columns?: string[];
  warning?: string;
  [key: string]: unknown;
}

export type LiveDatasetsResponse = Record<string, DatasetAuditEntry>;

export interface CandidateItem {
  id?: string;
  item_id?: string;
  text: string;
  word?: string;
  lemma?: string;
  source?: string;
  split?: string;
  [key: string]: unknown;
}

export interface CandidatesResponse {
  items: CandidateItem[];
  message?: string;
}

export interface AnnotationPayload {
  item_id: string;
  word: string;
  sense_id: string;
  annotator: string;
  status: 'reviewed' | 'pending' | 'disputed';
}

export interface AnnotationsResponse {
  records: Array<Record<string, unknown>>;
  gold: Array<Record<string, unknown>>;
}

export interface BatchResultRow {
  text: string;
  word?: string;
  sense_id?: string | null;
  hindi?: string | null;
  definition?: string | null;
  method?: string;
  status?: string;
  confidence?: number | null;
  lid_summary?: string;
  error?: string;
  [key: string]: unknown;
}

export interface TargetSpanMatch {
  word: string;
  surface: string;
  start: number;
  end: number;
}

export interface ModelMetricSummary {
  accuracy: number;
  macro_precision: number;
  macro_recall: number;
  macro_f1: number;
}

export interface PerClassMetrics {
  precision: number;
  recall: number;
  'f1-score': number;
  support: number;
}
