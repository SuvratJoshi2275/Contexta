import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Download,
  GitCompare,
  Loader2,
  Play,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  CompareResponse,
  ConnectionStatus,
  InventoryMap,
} from '../types/contexta';
import {
  EVALUATION_V2_REPORTS,
  MODEL_COMPARISON,
} from '../data/researchArtifacts';
import { compareModels, triggerFileDownload } from '../services/api';
import { detectInventorySpans, formatPercent } from '../utils/nlp';
import {
  JsonArtifactAccordion,
  ModuleHero,
  OfflineGateBanner,
  ProvenanceBar,
} from '../components/Layout';
import { TargetSpanEditor } from '../components/TargetSpanEditor';

interface ModelComparisonViewProps {
  inventory: InventoryMap;
  connectionStatus: ConnectionStatus;
  apiBaseUrl: string;
  text: string;
  onTextChange: (t: string) => void;
  result: CompareResponse | null;
  onResultChange: (r: CompareResponse | null) => void;
  onRetryConnection: () => void;
  onOpenConnectionModal: () => void;
}

export function ModelComparisonView({
  inventory,
  connectionStatus,
  apiBaseUrl,
  text,
  onTextChange,
  result,
  onResultChange,
  onRetryConnection,
  onOpenConnectionModal,
}: ModelComparisonViewProps) {
  const [selectedSpanIndex, setSelectedSpanIndex] = useState(0);
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
  const isOnline = connectionStatus === 'online';
  const canRun = isOnline && !loading && activeSpan !== null;

  const historicalChartData = useMemo(
    () =>
      Object.entries(MODEL_COMPARISON).map(([model, metrics]) => ({
        model,
        Accuracy: Number((metrics.accuracy * 100).toFixed(2)),
        'Macro F1': Number((metrics.macro_f1 * 100).toFixed(2)),
      })),
    [],
  );

  const handleCompare = async () => {
    if (!canRun || !activeSpan) return;
    setLoading(true);
    setError(null);
    try {
      const response = await compareModels(
        {
          text,
          word: activeSpan.word,
          target_char_start: activeSpan.start,
          target_char_end: activeSpan.end,
          include_translation: includeTranslation,
        },
        apiBaseUrl,
      );
      onResultChange(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Model comparison request failed.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-16">
      <ModuleHero
        kicker="Live Inference Lab + Historical Benchmarks · POST /api/compare"
        title="Model Comparison Laboratory"
        subtitle="Contrast live Dictionary, Rule-Based, XLM-R LoRA, and Hybrid LoRA predictions side by side, and inspect saved evaluation_v2 benchmark reports."
        metaItems={[
          'Live adapters: Dictionary · Rule · XLM-R LoRA · Hybrid LoRA',
          'Historical benchmark split: wsd_v2_test (n=62)',
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pt-8 space-y-10 sm:px-6 lg:px-10">
        {/* Live comparison section */}
        <section className="space-y-5">
          <OfflineGateBanner
            connectionStatus={connectionStatus}
            featureName="Live Model Comparison"
            endpointPath="POST /api/compare"
            onRetry={onRetryConnection}
            onOpenSettings={onOpenConnectionModal}
          />

          <div className="rounded-xl border border-[#282828] bg-[#181818] p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-white">
                Live Multi-Model Comparison
              </h2>
              {result && (
                <button
                  type="button"
                  onClick={() =>
                    triggerFileDownload(
                      JSON.stringify(result, null, 2),
                      'contexta_comparison.json',
                      'application/json',
                    )
                  }
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-[#343434] bg-[#222222] px-4 text-xs font-semibold text-white hover:bg-[#2E2E2E]"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download JSON</span>
                </button>
              )}
            </div>

            <TargetSpanEditor
              idPrefix="compare"
              text={text}
              onTextChange={onTextChange}
              selectedSpanIndex={selectedSpanIndex}
              onSelectSpanIndex={setSelectedSpanIndex}
              inventory={inventory}
            />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <label className="flex items-center gap-2.5 text-xs text-[#CCCCCC] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTranslation}
                  onChange={(e) => setIncludeTranslation(e.target.checked)}
                  className="h-4 w-4 rounded border-[#3A3A3A] bg-[#121212] accent-[#1DB954]"
                />
                <span>Include experimental MarianMT translation</span>
              </label>

              <button
                type="button"
                onClick={handleCompare}
                disabled={!canRun}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1DB954] px-6 text-sm font-bold text-black hover:bg-[#1ED760] disabled:cursor-not-allowed disabled:bg-[#2A2A2A] disabled:text-[#737373] transition-colors whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Comparing models…</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>
                      {isOnline
                        ? 'Run Live Comparison'
                        : 'Run Live Comparison (Backend Offline)'}
                    </span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200"
              >
                {error}
              </div>
            )}

            {result ? (
              <div className="space-y-4 pt-2">
                <ProvenanceBar
                  sourceType="live"
                  sourcePath="POST /api/compare"
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      title: 'Dictionary Default',
                      data: result.dictionary,
                      highlight: false,
                    },
                    {
                      title: 'Rule-Based',
                      data: result.rule,
                      highlight: false,
                    },
                    {
                      title: 'XLM-R LoRA',
                      data: result.neural,
                      highlight: false,
                    },
                    {
                      title: 'Hybrid LoRA',
                      data: result.hybrid,
                      highlight: true,
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className={`rounded-xl border p-4 space-y-2 ${
                        item.highlight
                          ? 'border-[#1DB954]/60 bg-[#1DB954]/10'
                          : 'border-[#282828] bg-[#121212]'
                      }`}
                    >
                      <div className="text-xs font-semibold text-[#B3B3B3]">
                        {item.title}
                      </div>
                      {item.data ? (
                        <>
                          <div className="font-display text-2xl font-bold text-white">
                            {item.data.hindi || '—'}
                          </div>
                          <div className="font-mono-tabular text-xs text-[#1DB954]">
                            {item.data.sense_id || '—'}
                          </div>
                          <p className="text-xs text-[#A3A3A3]">
                            {item.data.definition}
                          </p>
                          {'confidence' in item.data &&
                            item.data.confidence !== null && (
                              <div className="font-mono-tabular text-[11px] text-[#8E8E8E]">
                                Raw conf: {formatPercent(item.data.confidence)}
                              </div>
                            )}
                        </>
                      ) : (
                        <div className="pt-2 text-xs text-[#8E8E8E]">
                          Not supported for this lemma (6-lemma neural scope).
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {result.warnings.length > 0 && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                    <div className="space-y-1">
                      {result.warnings.map((w) => (
                        <p key={w}>{w}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#303030] bg-[#121212] p-8 text-center space-y-2">
                <GitCompare className="mx-auto h-5 w-5 text-[#1DB954]" />
                <p className="text-xs text-[#A3A3A3]">
                  {isOnline
                    ? 'Click Run Live Comparison to evaluate all active inference adapters on your chosen target span.'
                    : 'Live multi-model comparison requires the local FastAPI backend. Historical v2 benchmarks remain viewable below.'}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Historical Benchmarks Section (strictly separated) */}
        <section className="space-y-5 border-t border-[#242424] pt-8">
          <div className="space-y-1.5">
            <h2 className="font-display text-xl font-bold text-white">
              Historical WSD v2 Benchmark Artifacts
            </h2>
            <ProvenanceBar
              sourceType="historical"
              sourcePath="research_results/evaluation_v2/model_comparison.json"
              note="Saved test partition (n=62) · Logistic Regression & MLP are historical benchmarks"
            />
          </div>

          <div className="rounded-xl border border-[#282828] bg-[#181818] p-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={historicalChartData}
                  margin={{ top: 10, right: 16, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
                  <XAxis
                    dataKey="model"
                    tick={{ fill: '#B3B3B3', fontSize: 11 }}
                    interval={0}
                    angle={-12}
                    textAnchor="end"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#B3B3B3', fontSize: 11 }}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121212',
                      borderColor: '#333333',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: number) => `${val.toFixed(2)}%`}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="Accuracy" fill="#1DB954" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Macro F1" fill="#38BDF8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-xs text-[#8E8E8E]">
              Caveat: Logistic Regression and Residual MLP are historical
              benchmarks unless independently deployed as live inference
              adapters. Never interpret 100% on a 62-example custom partition as
              universal open-domain generalization.
            </p>
          </div>

          <div className="space-y-3">
            {Object.entries(EVALUATION_V2_REPORTS).map(([name, report]) => (
              <JsonArtifactAccordion
                key={name}
                title={name}
                sourcePath={`research_results/${name}`}
                data={report}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
