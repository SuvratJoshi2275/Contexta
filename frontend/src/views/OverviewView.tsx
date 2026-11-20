import React from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Database,
  FlaskConical,
  Languages,
  Microscope,
  Server,
  ServerOff,
  Sparkles,
} from 'lucide-react';
import type {
  ConnectionStatus,
  HealthResponse,
  InventoryMap,
  ModuleId,
} from '../types/contexta';
import {
  FINAL_RESEARCH_MANIFEST,
  HYBRID_CONFIG,
  INTEGRATION_SUMMARY,
  LID_FINAL_TEST_METRICS,
  MODEL_COMPARISON,
  MULTILINGUAL_DATASET_AUDIT,
  NEURAL_SUPPORTED_WORDS,
  NOTEBOOKS_MANIFEST,
  REGRESSION_CHECKS,
  TRANSLATION_RESULTS,
} from '../data/researchArtifacts';
import { formatMetric, formatPercent, getInventoryStats } from '../utils/nlp';
import {
  JsonArtifactAccordion,
  ModuleHero,
  ProvenanceBar,
} from '../components/Layout';

interface OverviewViewProps {
  inventory: InventoryMap;
  inventorySource: 'live' | 'bundled';
  connectionStatus: ConnectionStatus;
  health: HealthResponse | null;
  onNavigate: (module: ModuleId) => void;
  onOpenConnectionModal: () => void;
  onRetryConnection: () => void;
}

export function OverviewView({
  inventory,
  inventorySource,
  connectionStatus,
  health,
  onNavigate,
  onOpenConnectionModal,
  onRetryConnection,
}: OverviewViewProps) {
  const stats = getInventoryStats(inventory, NEURAL_SUPPORTED_WORDS);
  const hybridV2 = MODEL_COMPARISON['Hybrid LoRA'];
  const auditedCorpora = Object.entries(MULTILINGUAL_DATASET_AUDIT);

  const quickLabs: Array<{
    id: ModuleId;
    title: string;
    subtitle: string;
    tag: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'wsd',
      title: 'Contextual WSD Laboratory',
      subtitle: 'Target-span XLM-R LoRA routing with lexical rule fallback.',
      tag: 'Live API',
      icon: FlaskConical,
    },
    {
      id: 'lid',
      title: 'Code-Mixed Language ID',
      subtitle: 'Comi-Lingua 3-class token classification (Hindi / English / Other).',
      tag: 'Live API',
      icon: Languages,
    },
    {
      id: 'translation',
      title: 'Neural Translation Studio',
      subtitle: 'Experimental fine-tuned MarianMT English → Hindi generation.',
      tag: 'Live API',
      icon: Sparkles,
    },
    {
      id: 'inventory',
      title: 'Sense Inventory Explorer',
      subtitle: `Browse all ${stats.totalWords} ambiguous lemmas and Devanagari glosses.`,
      tag: inventorySource === 'live' ? 'Live + Bundled' : 'Bundled JSON',
      icon: BookOpen,
    },
    {
      id: 'evaluation',
      title: 'Evaluation & Benchmarking',
      subtitle: 'Verified WSD v2, Comi-Lingua LID, and MarianMT test reports.',
      tag: 'Historical Artifacts',
      icon: BarChart3,
    },
    {
      id: 'ablation',
      title: 'Ablation & Error Analysis',
      subtitle: 'Lemma-restriction masking (+8.06pp acc) and hybrid threshold sweep.',
      tag: 'Historical Artifacts',
      icon: Microscope,
    },
  ];

  return (
    <div className="pb-16">
      <ModuleHero
        kicker="Contexta · Multilingual NLP Research Platform"
        title="Multilingual intelligence, grounded in reproducible research"
        subtitle="Context-aware English–Hindi word sense disambiguation, Hindi–English code-mixed language identification, and experimental neural translation with transparent provenance."
        metaItems={[
          `${stats.totalWords} curated lemmas (${stats.totalSenses} senses)`,
          `${stats.neuralCount} XLM-R LoRA neural targets`,
          `${NOTEBOOKS_MANIFEST.length} research notebooks`,
          connectionStatus === 'online'
            ? 'Live FastAPI connected'
            : 'Preview mode · live inference locked until local FastAPI connects',
        ]}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('wsd')}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1DB954] px-6 text-sm font-bold text-black hover:bg-[#1ED760] transition-colors whitespace-nowrap"
            >
              <span>Open WSD Lab</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('evaluation')}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[#383838] bg-[#181818] px-5 text-sm font-semibold text-white hover:bg-[#282828] transition-colors whitespace-nowrap"
            >
              <span>Inspect Benchmarks</span>
            </button>
          </div>
        }
      />

      <div className="mx-auto max-w-7xl px-4 pt-8 space-y-10 sm:px-6 lg:px-10">
        {/* Top KPI Strip (dynamically computed from loaded inventory & artifacts) */}
        <section aria-label="Platform metrics">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-[#282828] bg-[#181818] p-5">
              <div className="text-xs font-medium text-[#A3A3A3]">
                Ambiguous Lemmas
              </div>
              <div className="mt-3 font-mono-tabular text-3xl font-bold text-white">
                {stats.totalWords}
              </div>
              <p className="mt-1.5 text-xs text-[#8E8E8E]">
                {stats.totalSenses} curated Hindi–English senses (
                {inventorySource === 'live' ? 'live API' : 'configs/inventory.json'})
              </p>
            </div>

            <div className="rounded-xl border border-[#282828] bg-[#181818] p-5">
              <div className="text-xs font-medium text-[#A3A3A3]">
                Neural LoRA Targets
              </div>
              <div className="mt-3 font-mono-tabular text-3xl font-bold text-[#1DB954]">
                {stats.neuralCount}
              </div>
              <p className="mt-1.5 text-xs text-[#8E8E8E]">
                {HYBRID_CONFIG.sense_labels.length} sense classes · {stats.ruleOnlyCount} rule-only lemmas
              </p>
            </div>

            <div className="rounded-xl border border-[#282828] bg-[#181818] p-5">
              <div className="text-xs font-medium text-[#A3A3A3]">
                Research Notebooks
              </div>
              <div className="mt-3 font-mono-tabular text-3xl font-bold text-white">
                {NOTEBOOKS_MANIFEST.length}
              </div>
              <p className="mt-1.5 text-xs text-[#8E8E8E]">
                Notebooks 01–20 reproducible pipeline lineage
              </p>
            </div>

            <div className="rounded-xl border border-[#282828] bg-[#181818] p-5">
              <div className="text-xs font-medium text-[#A3A3A3]">
                FastAPI Inference Service
              </div>
              <div
                className={`mt-3 font-display text-2xl font-bold ${
                  connectionStatus === 'online'
                    ? 'text-[#1DB954]'
                    : 'text-amber-400'
                }`}
              >
                {connectionStatus === 'online'
                  ? 'Connected'
                  : connectionStatus === 'checking'
                    ? 'Checking…'
                    : 'Offline'}
              </div>
              <p className="mt-2 text-xs text-[#8E8E8E]">
                {connectionStatus === 'online'
                  ? 'Live model inference unlocked'
                  : 'Read-only research mode active'}
              </p>
            </div>
          </div>
        </section>

        {/* Live Model Readiness Section */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Live Model Readiness
              </h2>
              <p className="mt-1 text-xs text-[#A3A3A3]">
                Real-time checkpoint availability from{' '}
                <code className="font-mono-tabular text-[#D4D4D4]">
                  GET /api/health
                </code>
                .
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onRetryConnection}
                className="h-9 rounded-full border border-[#343434] bg-[#181818] px-4 text-xs font-semibold text-white hover:bg-[#282828] transition-colors"
              >
                Check API Connection
              </button>
              <button
                type="button"
                onClick={onOpenConnectionModal}
                className="h-9 rounded-full bg-white px-4 text-xs font-bold text-black hover:bg-[#E5E5E5] transition-colors"
              >
                Configure Endpoint
              </button>
            </div>
          </div>

          {connectionStatus === 'online' && health ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                {
                  name: 'XLM-R LoRA WSD Adapter',
                  ready: health.models.wsd_lora,
                  detail: `${stats.neuralCount} lemmas · threshold τ = ${HYBRID_CONFIG.threshold}`,
                },
                {
                  name: 'Comi-Lingua 3-Class LID',
                  ready: health.models.lid,
                  detail: 'Char TF-IDF + Logistic Regression',
                },
                {
                  name: 'MarianMT En → Hi',
                  ready: health.models.translation,
                  detail: 'Experimental Helsinki-NLP fine-tuned checkpoint',
                },
              ].map((model) => (
                <div
                  key={model.name}
                  className="rounded-xl border border-[#282828] bg-[#181818] p-5 flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {model.name}
                    </div>
                    <p className="mt-1 text-xs text-[#A3A3A3]">{model.detail}</p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-semibold ${
                      model.ready ? 'text-[#1DB954]' : 'text-amber-400'
                    }`}
                  >
                    {model.ready ? 'Checkpoint Ready' : 'Not Loaded'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-[#282828] bg-[#181818] p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
                  <ServerOff className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">
                    FastAPI Backend Not Reachable in Hosted Preview
                  </h3>
                  <p className="text-xs leading-relaxed text-[#B3B3B3] max-w-2xl">
                    Start your local Contexta FastAPI server at{' '}
                    <code className="font-mono-tabular text-white">
                      http://127.0.0.1:8000
                    </code>{' '}
                    to enable live WSD, LID, MarianMT translation, batch CSV
                    execution, and annotation saving. No sample predictions are
                    substituted for live inference.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenConnectionModal}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#1DB954] px-5 text-xs font-bold text-black hover:bg-[#1ED760] transition-colors whitespace-nowrap"
              >
                <Server className="h-3.5 w-3.5" />
                <span>View Local Setup</span>
              </button>
            </div>
          )}
        </section>

        {/* Explore Modules Grid (Spotify-style elevated card deck) */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold text-white">
            Research Workspace Modules
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickLabs.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onNavigate(card.id)}
                  className="group rounded-xl border border-[#262626] bg-[#181818] p-5 text-left transition-colors duration-150 hover:bg-[#242424] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#242424] text-[#1DB954] group-hover:bg-[#1DB954] group-hover:text-black transition-colors duration-150">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-medium text-[#8E8E8E]">
                      {card.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold text-white">
                    {card.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#B3B3B3]">
                    {card.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Verified Historical Research Summary */}
        <section className="space-y-4">
          <div className="space-y-1.5">
            <h2 className="font-display text-xl font-bold text-white">
              Verified Empirical Snapshot
            </h2>
            <ProvenanceBar
              sourceType="historical"
              sourcePath="research_results/{evaluation_v2, comilingua_lid, translation_v1, senseforge_final}"
              note="Saved offline experiment reports · Not live inference"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-[#282828] bg-[#181818] p-5 space-y-3">
              <div className="text-xs font-semibold text-[#1DB954]">
                Hybrid LoRA WSD (wsd_v2_test · n=62)
              </div>
              <div className="flex items-baseline gap-4">
                <div>
                  <div className="font-mono-tabular text-2xl font-bold text-white">
                    {formatPercent(hybridV2?.accuracy)}
                  </div>
                  <div className="text-[11px] text-[#8E8E8E]">Accuracy</div>
                </div>
                <div>
                  <div className="font-mono-tabular text-2xl font-bold text-white">
                    {formatPercent(hybridV2?.macro_f1)}
                  </div>
                  <div className="text-[11px] text-[#8E8E8E]">Macro F1</div>
                </div>
              </div>
              <p className="text-xs text-[#A3A3A3]">
                Rule-Based baseline: {formatPercent(MODEL_COMPARISON['Rule-Based']?.accuracy)}{' '}
                acc · Dictionary default:{' '}
                {formatPercent(MODEL_COMPARISON['Dictionary']?.accuracy)} acc.
              </p>
            </div>

            <div className="rounded-xl border border-[#282828] bg-[#181818] p-5 space-y-3">
              <div className="text-xs font-semibold text-sky-400">
                Comi-Lingua 3-Class LID (n={LID_FINAL_TEST_METRICS.test_tokens.toLocaleString()})
              </div>
              <div className="flex items-baseline gap-4">
                <div>
                  <div className="font-mono-tabular text-2xl font-bold text-white">
                    {formatPercent(LID_FINAL_TEST_METRICS.metrics.accuracy)}
                  </div>
                  <div className="text-[11px] text-[#8E8E8E]">Accuracy</div>
                </div>
                <div>
                  <div className="font-mono-tabular text-2xl font-bold text-white">
                    {formatPercent(LID_FINAL_TEST_METRICS.metrics.macro_f1)}
                  </div>
                  <div className="text-[11px] text-[#8E8E8E]">Macro F1</div>
                </div>
              </div>
              <p className="text-xs text-[#A3A3A3]">
                Sentence-disjoint regrouped test split · mapping status:{' '}
                {LID_FINAL_TEST_METRICS.mapping_status}.
              </p>
            </div>

            <div className="rounded-xl border border-[#282828] bg-[#181818] p-5 space-y-3">
              <div className="text-xs font-semibold text-violet-400">
                MarianMT En → Hi (n={TRANSLATION_RESULTS.test_examples} test)
              </div>
              <div className="flex items-baseline gap-4">
                <div>
                  <div className="font-mono-tabular text-2xl font-bold text-white">
                    {formatMetric(TRANSLATION_RESULTS.finetuned_test.sacrebleu)}
                  </div>
                  <div className="text-[11px] text-[#8E8E8E]">sacreBLEU</div>
                </div>
                <div>
                  <div className="font-mono-tabular text-2xl font-bold text-white">
                    {formatMetric(TRANSLATION_RESULTS.finetuned_test.chrf)}
                  </div>
                  <div className="text-[11px] text-[#8E8E8E]">chrF</div>
                </div>
              </div>
              <p className="text-xs text-[#A3A3A3]">
                Trained on {TRANSLATION_RESULTS.training_examples.toLocaleString()}{' '}
                subset pairs (IIT-B + Samanantar).
              </p>
            </div>
          </div>

          {/* Dataset audit summary + Regression verification */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-[#282828] bg-[#181818] p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Database className="h-4 w-4 text-[#1DB954]" />
                  <span>Audited External Corpora</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('datasets')}
                  className="text-xs font-semibold text-[#1DB954] hover:text-[#1ED760]"
                >
                  Open Dataset Intelligence
                </button>
              </div>
              <div className="divide-y divide-[#262626] text-xs">
                {auditedCorpora.map(([name, info]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between py-2.5 gap-4"
                  >
                    <div>
                      <div className="font-semibold text-white">{name}</div>
                      <div className="text-[#8E8E8E]">
                        {info.file_count} audited files
                      </div>
                    </div>
                    <div className="text-right font-mono-tabular text-[#B3B3B3]">
                      {info.sample_files
                        .reduce((acc, f) => acc + f.size_mb, 0)
                        .toFixed(1)}{' '}
                      MB audited
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#282828] bg-[#181818] p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <CheckCircle2 className="h-4 w-4 text-[#1DB954]" />
                <span>Saved Alignment & Integrity Checks</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  {
                    label: 'Train Split',
                    checked: REGRESSION_CHECKS.train_alignment.checked,
                    failures: REGRESSION_CHECKS.train_alignment.failures,
                  },
                  {
                    label: 'Validation',
                    checked: REGRESSION_CHECKS.validation_alignment.checked,
                    failures: REGRESSION_CHECKS.validation_alignment.failures,
                  },
                  {
                    label: 'Test Split',
                    checked: REGRESSION_CHECKS.test_alignment.checked,
                    failures: REGRESSION_CHECKS.test_alignment.failures,
                  },
                ].map((split) => (
                  <div
                    key={split.label}
                    className="rounded-lg border border-[#262626] bg-[#121212] p-3"
                  >
                    <div className="text-[11px] text-[#8E8E8E]">{split.label}</div>
                    <div className="mt-1 font-mono-tabular text-lg font-bold text-white">
                      {split.checked}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#1DB954]">
                      {split.failures} failures
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs leading-relaxed text-[#A3A3A3]">
                Notebook 20 integration check: {INTEGRATION_SUMMARY.wsd_correct}/
                {INTEGRATION_SUMMARY.wsd_demonstrations} WSD demonstrations passed
                · Multiple-occurrence span test:{' '}
                <span className="text-white">
                  {INTEGRATION_SUMMARY.multiple_occurrence_test}
                </span>
                .
              </p>
            </div>
          </div>

          {/* Scientific limitations */}
          <div className="rounded-xl border border-[#282828] bg-[#181818] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">
              Documented Scientific Limitations
            </h3>
            <ul className="grid grid-cols-1 gap-2 text-xs text-[#B3B3B3] md:grid-cols-2">
              {FINAL_RESEARCH_MANIFEST.limitations.map((lim) => (
                <li key={lim} className="flex items-start gap-2">
                  <span aria-hidden="true" className="text-amber-400">
                    •
                  </span>
                  <span>{lim}</span>
                </li>
              ))}
            </ul>
          </div>

          <JsonArtifactAccordion
            title="Inspect Saved Integration Summary Artifact"
            sourcePath="research_results/senseforge_end_to_end/integration_summary.json"
            data={INTEGRATION_SUMMARY}
          />
        </section>
      </div>
    </div>
  );
}
