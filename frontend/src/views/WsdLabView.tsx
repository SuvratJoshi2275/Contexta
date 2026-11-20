import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Download,
  FlaskConical,
  Loader2,
  Play,
} from 'lucide-react';
import type {
  ConnectionStatus,
  InferenceMethod,
  InventoryMap,
  PredictResponse,
} from '../types/contexta';
import {
  HYBRID_CONFIG,
  NEURAL_SUPPORTED_WORDS,
} from '../data/researchArtifacts';
import { predictSense, triggerFileDownload } from '../services/api';
import { detectInventorySpans, formatPercent } from '../utils/nlp';
import {
  JsonArtifactAccordion,
  ModuleHero,
  OfflineGateBanner,
  ProvenanceBar,
} from '../components/Layout';
import { TargetSpanEditor } from '../components/TargetSpanEditor';

interface WsdLabViewProps {
  inventory: InventoryMap;
  connectionStatus: ConnectionStatus;
  apiBaseUrl: string;
  text: string;
  onTextChange: (t: string) => void;
  result: PredictResponse | null;
  onResultChange: (r: PredictResponse | null) => void;
  onRetryConnection: () => void;
  onOpenConnectionModal: () => void;
}

const METHODS: Array<{ value: InferenceMethod; label: string; note: string }> = [
  {
    value: 'hybrid',
    label: 'Hybrid LoRA',
    note: `XLM-R LoRA (τ=${HYBRID_CONFIG.threshold}) with lexical rule fallback`,
  },
  {
    value: 'rule',
    label: 'Rule-Based',
    note: 'Deterministic cue matching over inventory',
  },
  {
    value: 'dictionary',
    label: 'Dictionary Default',
    note: 'Most-frequent default sense baseline',
  },
  {
    value: 'neural',
    label: 'Neural LoRA Only',
    note: `Strict 6-lemma XLM-R LoRA adapter`,
  },
];

export function WsdLabView({
  inventory,
  connectionStatus,
  apiBaseUrl,
  text,
  onTextChange,
  result,
  onResultChange,
  onRetryConnection,
  onOpenConnectionModal,
}: WsdLabViewProps) {
  const [selectedSpanIndex, setSelectedSpanIndex] = useState(0);
  const [method, setMethod] = useState<InferenceMethod>('hybrid');
  const [includeTranslation, setIncludeTranslation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const spans = useMemo(
    () => detectInventorySpans(text, inventory),
    [text, inventory],
  );
  const safeIdx =
    spans.length === 0 ? -1 : Math.min(selectedSpanIndex, spans.length - 1);
  const activeSpan = safeIdx >= 0 ? spans[safeIdx] : null;

  const isNeuralSupported = activeSpan
    ? NEURAL_SUPPORTED_WORDS.includes(activeSpan.word)
    : false;

  const isOnline = connectionStatus === 'online';
  const neuralIncompatible =
    method === 'neural' && activeSpan !== null && !isNeuralSupported;

  const canRun =
    isOnline && !loading && activeSpan !== null && !neuralIncompatible;

  const handleRun = async () => {
    if (!canRun || !activeSpan) return;
    setLoading(true);
    setError(null);
    try {
      const response = await predictSense(
        {
          text,
          word: activeSpan.word,
          method,
          target_char_start: activeSpan.start,
          target_char_end: activeSpan.end,
          include_translation: includeTranslation,
        },
        apiBaseUrl,
      );
      onResultChange(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'WSD inference request failed.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-16">
      <ModuleHero
        kicker="Live Inference Lab · POST /api/predict"
        title="Contextual WSD Laboratory"
        subtitle="Resolve the exact Hindi meaning of an ambiguous English lemma using target-centered XLM-R LoRA inference and interpretable lexical cue fallback."
        metaItems={[
          `Hybrid routing threshold τ = ${HYBRID_CONFIG.threshold}`,
          `${NEURAL_SUPPORTED_WORDS.length} neural lemmas · ${Object.keys(inventory).length} total inventory lemmas`,
          'Exact character-offset disambiguation',
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pt-8 space-y-6 sm:px-6 lg:px-10">
        <OfflineGateBanner
          connectionStatus={connectionStatus}
          featureName="Contextual WSD Laboratory"
          endpointPath="POST /api/predict"
          onRetry={onRetryConnection}
          onOpenSettings={onOpenConnectionModal}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Input & Controls Panel */}
          <div className="lg:col-span-5 rounded-xl border border-[#282828] bg-[#181818] p-6 space-y-5">
            <h2 className="font-display text-lg font-bold text-white">
              Target Context Input
            </h2>

            <TargetSpanEditor
              idPrefix="wsd"
              text={text}
              onTextChange={onTextChange}
              selectedSpanIndex={selectedSpanIndex}
              onSelectSpanIndex={setSelectedSpanIndex}
              inventory={inventory}
            />

            {/* Method selector */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#D4D4D4]">
                Inference method
              </div>
              <div className="grid grid-cols-2 gap-2">
                {METHODS.map((item) => {
                  const active = method === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setMethod(item.value)}
                      aria-pressed={active}
                      className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        active
                          ? 'border-[#1DB954] bg-[#1DB954]/12 text-white'
                          : 'border-[#2E2E2E] bg-[#121212] text-[#B3B3B3] hover:bg-[#222222] hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-semibold">{item.label}</div>
                      <div className="mt-0.5 text-[11px] text-[#8E8E8E] line-clamp-1">
                        {item.note}
                      </div>
                    </button>
                  );
                })}
              </div>
              {neuralIncompatible && activeSpan && (
                <p className="text-xs text-amber-300">
                  Pure Neural LoRA supports only the 6 trained lemmas (
                  {NEURAL_SUPPORTED_WORDS.join(', ')}). Switch to Hybrid LoRA or
                  Rule-Based to disambiguate “{activeSpan.word}”.
                </p>
              )}
            </div>

            {/* Optional MarianMT translation toggle for hybrid/neural */}
            {(method === 'hybrid' || method === 'neural') && (
              <label className="flex items-center gap-2.5 text-xs text-[#CCCCCC] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTranslation}
                  onChange={(e) => setIncludeTranslation(e.target.checked)}
                  className="h-4 w-4 rounded border-[#3A3A3A] bg-[#121212] accent-[#1DB954]"
                />
                <span>
                  Also request experimental MarianMT sentence translation
                </span>
              </label>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200"
              >
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleRun}
              disabled={!canRun}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1DB954] px-6 text-sm font-bold text-black hover:bg-[#1ED760] disabled:cursor-not-allowed disabled:bg-[#2A2A2A] disabled:text-[#737373] transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Running model inference…</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>
                    {isOnline
                      ? 'Disambiguate Context'
                      : 'Disambiguate Context (Backend Offline)'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Sense Resolution Output Panel */}
          <div className="lg:col-span-7 space-y-5">
            {result ? (
              <>
                {/* Hero WSD Resolution Card */}
                <div className="rounded-xl border border-[#282828] bg-[#181818] p-6 space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <ProvenanceBar
                        sourceType="live"
                        sourcePath="POST /api/predict"
                        note={result.status}
                      />
                      <div className="pt-2 font-display text-4xl font-extrabold text-[#1DB954] sm:text-5xl">
                        {result.hindi || '—'}
                      </div>
                      <p className="text-sm text-[#E5E5E5]">
                        {result.definition || 'No definition returned'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        triggerFileDownload(
                          JSON.stringify(result, null, 2),
                          'contexta_wsd.json',
                          'application/json',
                        )
                      }
                      className="inline-flex h-9 items-center gap-2 rounded-full border border-[#343434] bg-[#222222] px-4 text-xs font-semibold text-white hover:bg-[#2E2E2E] whitespace-nowrap"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download JSON</span>
                    </button>
                  </div>

                  {/* Structured telemetry strip */}
                  <div className="grid grid-cols-2 gap-3 border-t border-[#262626] pt-4 sm:grid-cols-4">
                    <div>
                      <div className="text-[11px] text-[#8E8E8E]">Sense ID</div>
                      <div className="mt-1 font-mono-tabular text-sm font-semibold text-white">
                        {result.sense_id || '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#8E8E8E]">Method</div>
                      <div className="mt-1 font-mono-tabular text-sm font-semibold text-white">
                        {result.method}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#8E8E8E]">
                        Target Span
                      </div>
                      <div className="mt-1 font-mono-tabular text-sm font-semibold text-white">
                        {result.target_span
                          ? `${result.target_span[0]}–${result.target_span[1]}`
                          : result.word}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#8E8E8E]">
                        Raw Confidence*
                      </div>
                      <div className="mt-1 font-mono-tabular text-sm font-semibold text-white">
                        {result.confidence !== null
                          ? formatPercent(result.confidence)
                          : 'N/A (rule)'}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#8E8E8E]">
                    *Softmax confidence is not a calibrated probability.
                  </p>

                  {result.warnings && result.warnings.length > 0 && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Inference Warnings</span>
                      </div>
                      {result.warnings.map((w) => (
                        <p key={w} className="text-xs text-amber-200/90">
                          {w}
                        </p>
                      ))}
                    </div>
                  )}

                  {result.translation_hi && (
                    <div className="rounded-lg border border-[#262626] bg-[#121212] p-4 space-y-1">
                      <div className="text-[11px] font-semibold text-[#8E8E8E]">
                        Experimental MarianMT Sentence Translation
                      </div>
                      <div className="text-base font-medium text-white">
                        {result.translation_hi}
                      </div>
                    </div>
                  )}
                </div>

                {/* Competing Sense Alternatives & Evidence Trace */}
                <div className="rounded-xl border border-[#282828] bg-[#181818] p-6 space-y-4">
                  <h3 className="font-display text-base font-bold text-white">
                    Sense Alternatives & Lexical Evidence
                  </h3>
                  <div className="space-y-3">
                    {result.alternatives.map((alt) => {
                      const chosen = alt.id === result.sense_id;
                      return (
                        <div
                          key={alt.id}
                          className={`rounded-lg border p-4 ${
                            chosen
                              ? 'border-[#1DB954]/60 bg-[#1DB954]/8'
                              : 'border-[#262626] bg-[#121212]'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-baseline gap-3">
                              <span className="font-display text-lg font-bold text-white">
                                {alt.hindi}
                              </span>
                              <span className="font-mono-tabular text-xs text-[#A3A3A3]">
                                {alt.id}
                              </span>
                            </div>
                            <span
                              className={`text-xs font-semibold ${
                                chosen ? 'text-[#1DB954]' : 'text-[#7A7A7A]'
                              }`}
                            >
                              {chosen ? 'Selected Sense' : 'Alternative'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#B3B3B3]">
                            {alt.definition}
                          </p>
                          <div className="mt-2 text-xs text-[#8E8E8E]">
                            Matched lexical cues:{' '}
                            <span className="font-mono-tabular text-[#D4D4D4]">
                              {alt.matched_cues.length > 0
                                ? alt.matched_cues.join(', ')
                                : 'None'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <JsonArtifactAccordion
                  title="Raw Prediction Trace"
                  sourcePath="POST /api/predict response"
                  data={result}
                />
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-[#303030] bg-[#181818] p-10 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#242424] text-[#1DB954]">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-bold text-white">
                  {isOnline
                    ? 'Ready for Live Sense Disambiguation'
                    : 'Waiting for Local FastAPI Backend'}
                </h3>
                <p className="mx-auto max-w-md text-xs leading-relaxed text-[#A3A3A3]">
                  {isOnline
                    ? 'Select any highlighted inventory word in your sentence and click Disambiguate Context to inspect live Hindi sense resolution, evidence traces, and competing alternatives.'
                    : 'You can still edit sentences and test target-span detection above. Start your local FastAPI backend to execute real XLM-R LoRA and rule-based disambiguation.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
