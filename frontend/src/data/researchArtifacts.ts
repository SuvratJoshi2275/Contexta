import type {
  InventoryMap,
  ModelMetricSummary,
  ModuleMeta,
  PerClassMetrics,
} from '../types/contexta';

import rawInventory from './artifacts/inventory.json';
import rawModelComparison from './artifacts/model_comparison.json';
import rawXlmrReport from './artifacts/xlm_r_lora_report.json';
import rawHybridReport from './artifacts/hybrid_lora_report.json';
import rawRuleReport from './artifacts/rule_based_report.json';
import rawDictionaryReport from './artifacts/dictionary_report.json';
import rawAblation from './artifacts/lemma_restriction_ablation.json';
import rawCalibration from './artifacts/calibration_results.json';
import rawHybridConfig from './artifacts/hybrid_config.json';
import rawLidTest from './artifacts/lid_final_test_metrics.json';
import rawLidMeta from './artifacts/lid_training_metadata.json';
import rawLidCleaning from './artifacts/lid_cleaning_audit.json';
import rawTranslationResults from './artifacts/final_translation_results.json';
import rawTranslationHistory from './artifacts/translation_training_history.json';
import rawDatasetAudit from './artifacts/multilingual_dataset_audit.json';
import rawFinalManifest from './artifacts/final_research_manifest.json';
import rawRegressionChecks from './artifacts/regression_checks.json';
import rawChallengeResults from './artifacts/challenge_results.json';
import rawBenchmarkProtocol from './artifacts/benchmark_protocol.json';
import rawIntegrationSummary from './artifacts/integration_summary.json';
import rawIntegrationDemos from './artifacts/integration_demo_results.json';
import rawCodeMixedDemo from './artifacts/code_mixed_demo.json';
import rawTranslationDemo from './artifacts/translation_demo.json';
import rawNotebooksManifest from './artifacts/notebooks_manifest.json';

export const BUNDLED_INVENTORY: InventoryMap = rawInventory as InventoryMap;

export const HYBRID_CONFIG = rawHybridConfig as {
  version: string;
  neural_model: string;
  supported_words: string[];
  sense_labels: string[];
  threshold: number;
  threshold_selection: string;
  fallback: string;
  confidence_type: string;
  validation_accuracy: number;
  validation_macro_f1: number;
  validation_examples: number;
  limitations: string[];
};

/** Dynamically derived from verified hybrid_config.json (never hardcoded). */
export const NEURAL_SUPPORTED_WORDS: readonly string[] =
  HYBRID_CONFIG.supported_words;

export const MODEL_COMPARISON = rawModelComparison as Record<
  string,
  ModelMetricSummary
>;

export const EVALUATION_V2_REPORTS = {
  'evaluation_v2/model_comparison.json': rawModelComparison,
  'evaluation_v2/xlm_r_lora_report.json': rawXlmrReport,
  'evaluation_v2/hybrid_lora_report.json': rawHybridReport,
  'evaluation_v2/rule_based_report.json': rawRuleReport,
  'evaluation_v2/dictionary_report.json': rawDictionaryReport,
};

export interface AblationSplitReport {
  accuracy: number;
  macro_precision: number;
  macro_recall: number;
  macro_f1: number;
  classification_report: Record<string, PerClassMetrics | number>;
}

export const LEMMA_RESTRICTION_ABLATION = rawAblation as {
  lemma_restricted: AblationSplitReport;
  unrestricted: AblationSplitReport;
  metadata: {
    model: string;
    evaluation_split: string;
    test_examples: number;
    ablation_type: string;
    predictions_changed: number;
    model_retrained: boolean;
  };
};

export const CALIBRATION_RESULTS = rawCalibration as {
  selection_split: string;
  results: Array<{
    threshold: number;
    accuracy: number;
    macro_f1: number;
    neural_usage: number;
  }>;
  selected: {
    threshold: number;
    accuracy: number;
    macro_f1: number;
    neural_usage: number;
  };
};

export const LID_FINAL_TEST_METRICS = rawLidTest as {
  metrics: ModelMetricSummary;
  test_tokens: number;
  model: string;
  mapping: Record<string, string>;
  mapping_status: string;
  split: string;
};

export const LID_TRAINING_METADATA = rawLidMeta as {
  project: string;
  task: string;
  model: string;
  dataset: string;
  training_examples: number;
  validation_examples: number;
  labels: string[];
  training_seconds: number;
  tfidf_features: number;
  validation_metrics: ModelMetricSummary;
  convergence_warnings: string[];
  test_evaluated: boolean;
  limitations: string[];
};

export const LID_CLEANING_AUDIT = rawLidCleaning as {
  train: {
    original_records: number;
    clean_records: number;
    removed_records: number;
    unique_sentences: number;
  };
  validation: {
    original_records: number;
    clean_records: number;
    removed_records: number;
    unique_sentences: number;
  };
  test: {
    original_records: number;
    clean_records: number;
    removed_records: number;
    unique_sentences: number;
  };
  conflict_policy: string;
  sentence_overlap: number;
};

export const TRANSLATION_RESULTS = rawTranslationResults as {
  model: string;
  training_examples: number;
  validation_examples: number;
  test_examples: number;
  best_epoch: number;
  training_seconds: number;
  pretrained_validation: { sacrebleu: number; chrf: number };
  finetuned_validation: { sacrebleu: number; chrf: number };
  finetuned_test: { sacrebleu: number; chrf: number };
  dataset_sources: Record<string, number>;
  limitations: string[];
};

export const TRANSLATION_TRAINING_HISTORY = rawTranslationHistory as Array<{
  epoch: number;
  train_loss: number;
  validation_bleu: number;
  validation_chrf: number;
  epoch_seconds: number;
}>;

export interface AuditedDatasetFile {
  name: string;
  size_mb: number;
  columns: string[];
}

export const MULTILINGUAL_DATASET_AUDIT = rawDatasetAudit as Record<
  string,
  {
    status: string;
    file_count: number;
    sample_files: AuditedDatasetFile[];
  }
>;

export const FINAL_RESEARCH_MANIFEST = rawFinalManifest as {
  artifact_audit: string;
  dataset_integrity: string;
  dataset_counts: { train: number; validation: number; test: number };
  models_loaded: boolean;
  smoke_test_accuracy: number;
  benchmark: string;
  project: string;
  notebook: string;
  neural_supported_words: string[];
  neural_sense_classes: number;
  hybrid_threshold: number;
  lid: { status: string; reason: string };
  heavy_training_executed: boolean;
  duration_seconds: number;
  limitations: string[];
};

export const REGRESSION_CHECKS = rawRegressionChecks as {
  sense_metadata: string;
  multiple_occurrence_handling: string;
  explicit_target_offsets: string;
  output_consistency: string;
  train_alignment: { checked: number; failures: number; examples: unknown[] };
  validation_alignment: { checked: number; failures: number; examples: unknown[] };
  test_alignment: { checked: number; failures: number; examples: unknown[] };
};

export const CHALLENGE_RESULTS = rawChallengeResults as {
  dataset: string;
  examples: number;
  results: Record<string, ModelMetricSummary>;
};

export const BENCHMARK_PROTOCOL = rawBenchmarkProtocol as {
  name: string;
  version: string;
  target_words: string[];
  sense_labels: string[];
  models: string[];
  evaluation_tracks: Record<
    string,
    { records?: number; status: string; eligible_for_model_selection: boolean }
  >;
  metrics: string[];
  restrictions: Record<string, boolean>;
};

export const INTEGRATION_SUMMARY = rawIntegrationSummary as {
  project: string;
  notebook: string;
  wsd_demonstrations: number;
  wsd_correct: number;
  wsd_demo_accuracy: number;
  metadata_consistency: string;
  multiple_occurrence_test: string;
  code_mixed_demo: string;
  translation_demo: string;
  lid_model: string;
  wsd_model: string;
  translation_model: string;
  runtime_seconds: number;
  limitations: string[];
};

export interface ArchivalIntegrationRecord {
  input_text: string;
  target_word: string;
  target_surface: string;
  target_span: number[];
  sense_id: string;
  hindi_meaning: string;
  definition: string;
  prediction_method: string;
  neural_confidence: number | null;
  confidence_calibrated: boolean;
  expected_sense?: string;
  correct?: boolean;
  translation_hi: string | null;
  translation_model: string | null;
  warnings: string[];
}

export const ARCHIVAL_INTEGRATION_RECORDS =
  rawIntegrationDemos as ArchivalIntegrationRecord[];

export const ARCHIVAL_CODE_MIXED_RECORD = rawCodeMixedDemo as ArchivalIntegrationRecord & {
  token_languages: Array<{ token: string; language: string; start: number; end: number }>;
};

export const ARCHIVAL_TRANSLATION_RECORD = rawTranslationDemo as ArchivalIntegrationRecord;

export const NOTEBOOKS_MANIFEST = rawNotebooksManifest as Array<{
  name: string;
  size_kb: number;
}>;

export const MODULES: readonly ModuleMeta[] = [
  {
    id: 'overview',
    label: 'Research Overview',
    shortLabel: 'Overview',
    group: 'Discover',
    description:
      'Context-aware word senses, Hindi–English code-mixed language identification, and reproducible research readiness.',
    requiresBackend: false,
  },
  {
    id: 'inventory',
    label: 'Sense Inventory Explorer',
    shortLabel: 'Sense Inventory',
    group: 'Discover',
    description:
      'Explore curated ambiguous lemmas, Devanagari Hindi glosses, sense definitions, and lexical evidence cues.',
    requiresBackend: false,
  },
  {
    id: 'wsd',
    label: 'Contextual WSD Laboratory',
    shortLabel: 'Contextual WSD',
    group: 'Live Inference Labs',
    description:
      'Target-aware word sense disambiguation with hybrid XLM-R LoRA routing and deterministic lexical rule fallback.',
    requiresBackend: true,
  },
  {
    id: 'lid',
    label: 'Code-Mixed Language ID',
    shortLabel: 'Code-Mixed LID',
    group: 'Live Inference Labs',
    description:
      'Supervised token-level Hindi, English, and Other classification trained on regrouped Comi-Lingua splits.',
    requiresBackend: true,
  },
  {
    id: 'translation',
    label: 'Neural Translation Studio',
    shortLabel: 'Neural Translation',
    group: 'Live Inference Labs',
    description:
      'Experimental fine-tuned MarianMT English-to-Hindi sequence-to-sequence translation.',
    requiresBackend: true,
  },
  {
    id: 'comparison',
    label: 'Model Comparison Lab',
    shortLabel: 'Model Comparison',
    group: 'Live Inference Labs',
    description:
      'Compare live Dictionary, Rule-Based, XLM-R LoRA, and Hybrid LoRA predictions alongside saved v2 benchmarks.',
    requiresBackend: true,
  },
  {
    id: 'batch',
    label: 'Batch Processing',
    shortLabel: 'Batch Processing',
    group: 'Live Inference Labs',
    description:
      'Validated, resource-bounded UTF-8 CSV inference through the live FastAPI model endpoints.',
    requiresBackend: true,
  },
  {
    id: 'annotation',
    label: 'Annotation Studio',
    shortLabel: 'Annotation Studio',
    group: 'Live Inference Labs',
    description:
      'Human-in-the-loop sense verification and adjudication via the FastAPI candidate and annotation endpoints.',
    requiresBackend: true,
  },
  {
    id: 'datasets',
    label: 'Dataset Intelligence',
    shortLabel: 'Datasets',
    group: 'Research & Corpora',
    description:
      'Live corpus availability checks, schema audits for Comi-Lingua, IIT-B, and Samanantar, and split cleaning reports.',
    requiresBackend: false,
  },
  {
    id: 'evaluation',
    label: 'Evaluation & Benchmarking',
    shortLabel: 'Evaluation',
    group: 'Research & Corpora',
    description:
      'Verified metrics, evaluation tracks, and generalization caveats across WSD v2, Comi-Lingua LID, and MarianMT.',
    requiresBackend: false,
  },
  {
    id: 'ablation',
    label: 'Ablation & Error Analysis',
    shortLabel: 'Ablation Analysis',
    group: 'Research & Corpora',
    description:
      'Inference-time lemma restriction study, hybrid confidence threshold sweep, and robustness challenge evidence.',
    requiresBackend: false,
  },
  {
    id: 'experiments',
    label: 'Experiments & Registry',
    shortLabel: 'Experiments',
    group: 'Research & Corpora',
    description:
      '20-notebook research lineage, regression checks, live report discovery, and archival Notebook 20 records.',
    requiresBackend: false,
  },
] as const;

export const MODULE_MAP: Record<ModuleMeta['id'], ModuleMeta> = MODULES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<ModuleMeta['id'], ModuleMeta>,
);
