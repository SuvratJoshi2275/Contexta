import React, { useMemo, useState } from 'react';
import { Download, Languages, Loader2, Play } from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { ConnectionStatus, LidResponse } from '../types/contexta';
import {
  LID_CLEANING_AUDIT,
  LID_FINAL_TEST_METRICS,
  LID_TRAINING_METADATA,
} from '../data/researchArtifacts';
import { identifyLanguages, triggerFileDownload } from '../services/api';
import { formatPercent } from '../utils/nlp';
import {
  ModuleHero,
  OfflineGateBanner,
  ProvenanceBar,
} from '../components/Layout';

interface LidLabViewProps {
  connectionStatus: ConnectionStatus;
  apiBaseUrl: string;
  text: string;
  onTextChange: (t: string) => void;
  result: LidResponse | null;
  onResultChange: (r: LidResponse | null) => void;
  onRetryConnection: () => void;
  onOpenConnectionModal: () => void;
}

const LANG_COLORS: Record<string, { bar: string; text: string; bg: string; label: string }> = {
  hi: {
    bar: '#A78BFA',
    text: 'text-violet-300',
    bg: 'bg-violet-500/15 border-violet-500/35',
    label: 'Hindi (hi)',
  },
  en: {
    bar: '#38BDF8',
    text: 'text-sky-300',
    bg: 'bg-sky-500/15 border-sky-500/35',
    label: 'English (en)',
  },
  other: {
    bar: '#1DB954',
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/15 border-emerald-500/35',
    label: 'Other (other)',
  },
};

function getLangStyle(code: string) {
  return (
    LANG_COLORS[code.toLowerCase()] ?? {
      bar: '#9CA3AF',
      text: 'text-neutral-300',
      bg: 'bg-neutral-500/15 border-neutral-500/35',
      label: code,
    }
  );
}

export function LidLabView({
  connectionStatus,
  apiBaseUrl,
  text,
  onTextChange,
  result,
  onResultChange,
  onRetryConnection,
  onOpenConnectionModal,
}: LidLabViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOnline = connectionStatus === 'online';
  const canRun = isOnline && !loading && text.trim().length > 0;

  const distribution = useMemo(() => {
    if (!result?.tokens?.length) return [];
    const counts = new Map<string, number>();
    for (const t of result.tokens) {
      counts.set(t.language, (counts.get(t.language) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([language, count]) => ({
      language,
      count,
      color: getLangStyle(language).bar,
    }));
  }, [result]);

  const handleRun = async () => {
    if (!canRun) return;
    setLoading(true);
    setError(null);
    try {
      const response = await identifyLanguages(text, apiBaseUrl);
      onResultChange(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'LID inference request failed.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-16">
      <ModuleHero
        kicker="Live Inference Lab · POST /api/lid"
        title="Code-Mixed Language Identification"
        subtitle="Supervised token-level Hindi, English, and Other classification trained on regrouped sentence-disjoint Comi-Lingua splits."
        metaItems={[
          'Model: comilingua_3class (Char TF-IDF + Logistic Regression)',
          'Token-only classifier · Provisional 3-class mapping',
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pt-8 space-y-8 sm:px-6 lg:px-10">
        <OfflineGateBanner
          connectionStatus={connectionStatus}
          featureName="Code-Mixed Language Identification"
          endpointPath="POST /api/lid"
          onRetry={onRetryConnection}
          onOpenSettings={onOpenConnectionModal}
        />

        {/* Live input + result grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-5 rounded-xl border border-[#282828] bg-[#181818] p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-white">
              English, Hindi, or Hinglish Input
            </h2>
            <div>
              <label
                htmlFor="lid-input-textarea"
                className="block text-xs font-semibold text-[#D4D4D4] mb-2"
              >
                Sentence to classify token-by-token
              </label>
              <textarea
                id="lid-input-textarea"
                rows={4}
                value={text}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="Hello mujhe bank jaana hai"
                className="w-full rounded-xl border border-[#323232] bg-[#121212] px-4 py-3 text-sm leading-relaxed text-white placeholder:text-[#666666] focus:border-[#1DB954] focus:outline-none"
              />
            </div>

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
                  <span>Classifying tokens…</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>
                    {isOnline
                      ? 'Identify Languages'
                      : 'Identify Languages (Backend Offline)'}
                  </span>
                </>
              )}
            </button>

            <p className="text-[11px] leading-relaxed text-[#8E8E8E]">
              Note: Token-only classifier without sentence-level context;
              three-class normalization (hi/h → hi, en/e → en, ot/u → other) is
              provisional.
            </p>
          </div>

          <div className="lg:col-span-7 space-y-5">
            {result ? (
              <>
                <div className="rounded-xl border border-[#282828] bg-[#181818] p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <ProvenanceBar
                      sourceType="live"
                      sourcePath="POST /api/lid"
                      note={`${result.tokens.length} tokens · ${result.model}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        triggerFileDownload(
                          JSON.stringify(result, null, 2),
                          'contexta_lid.json',
                          'application/json',
                        )
                      }
                      className="inline-flex h-9 items-center gap-2 rounded-full border border-[#343434] bg-[#222222] px-4 text-xs font-semibold text-white hover:bg-[#2E2E2E]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download JSON</span>
                    </button>
                  </div>

                  {/* Annotated token stream */}
                  <div className="flex flex-wrap gap-2">
                    {result.tokens.map((tok, i) => {
                      const style = getLangStyle(tok.language);
                      return (
                        <div
                          key={`${tok.start}-${tok.end}-${i}`}
                          className={`inline-flex items-baseline gap-2 rounded-lg border px-3 py-1.5 ${style.bg}`}
                        >
                          <span className="text-sm font-medium text-white">
                            {tok.token}
                          </span>
                          <span
                            className={`font-mono-tabular text-[11px] font-semibold ${style.text}`}
                          >
                            {tok.language}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Donut chart + Token table */}
                  <div className="grid grid-cols-1 gap-6 border-t border-[#262626] pt-5 md:grid-cols-12">
                    <div className="md:col-span-5 h-52">
                      <div className="text-xs font-semibold text-[#B3B3B3] mb-2">
                        Token Distribution
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={distribution}
                            dataKey="count"
                            nameKey="language"
                            innerRadius={48}
                            outerRadius={74}
                            paddingAngle={3}
                          >
                            {distribution.map((entry) => (
                              <Cell key={entry.language} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#181818',
                              borderColor: '#333333',
                              borderRadius: '8px',
                              fontSize: '12px',
                              color: '#ffffff',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="md:col-span-7 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#2A2A2A] text-[#8E8E8E]">
                            <th className="py-2 pr-3 font-medium">Token</th>
                            <th className="py-2 pr-3 font-medium">Language</th>
                            <th className="py-2 text-right font-medium">
                              Char Span
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#222222]">
                          {result.tokens.map((tok, i) => (
                            <tr key={`${tok.start}-${i}`} className="hover:bg-[#222222]">
                              <td className="py-2 pr-3 font-medium text-white">
                                {tok.token}
                              </td>
                              <td
                                className={`py-2 pr-3 font-mono-tabular font-semibold ${getLangStyle(tok.language).text}`}
                              >
                                {tok.language}
                              </td>
                              <td className="py-2 text-right font-mono-tabular text-[#A3A3A3]">
                                {tok.start}–{tok.end}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-[#303030] bg-[#181818] p-10 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#242424] text-sky-400">
                  <Languages className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-bold text-white">
                  {isOnline
                    ? 'Ready for Live Token-Level LID'
                    : 'Live LID Locked While Offline'}
                </h3>
                <p className="mx-auto max-w-md text-xs leading-relaxed text-[#A3A3A3]">
                  {isOnline
                    ? 'Enter any English, Hindi, or Hinglish text and click Identify Languages to visualize token-level tags and character offsets.'
                    : 'Connect your local FastAPI server to run real-time Comi-Lingua token classification. Verified historical test metrics remain available below.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Read-only Historical Comi-Lingua Model Card */}
        <section className="space-y-4 border-t border-[#242424] pt-8">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-bold text-white">
              Verified Comi-Lingua LID Benchmark Summary
            </h2>
            <ProvenanceBar
              sourceType="historical"
              sourcePath="research_results/senseforge_final/comilingua_lid/training_v1/normalized_3class/final_test_metrics.json"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-[#282828] bg-[#181818] p-4">
              <div className="text-xs text-[#A3A3A3]">3-Class Test Accuracy</div>
              <div className="mt-2 font-mono-tabular text-2xl font-bold text-[#1DB954]">
                {formatPercent(LID_FINAL_TEST_METRICS.metrics.accuracy)}
              </div>
              <div className="mt-1 text-[11px] text-[#8E8E8E]">
                {LID_FINAL_TEST_METRICS.test_tokens.toLocaleString()} test tokens
              </div>
            </div>
            <div className="rounded-xl border border-[#282828] bg-[#181818] p-4">
              <div className="text-xs text-[#A3A3A3]">3-Class Macro F1</div>
              <div className="mt-2 font-mono-tabular text-2xl font-bold text-white">
                {formatPercent(LID_FINAL_TEST_METRICS.metrics.macro_f1)}
              </div>
              <div className="mt-1 text-[11px] text-[#8E8E8E]">
                Precision {formatPercent(LID_FINAL_TEST_METRICS.metrics.macro_precision)} · Recall{' '}
                {formatPercent(LID_FINAL_TEST_METRICS.metrics.macro_recall)}
              </div>
            </div>
            <div className="rounded-xl border border-[#282828] bg-[#181818] p-4">
              <div className="text-xs text-[#A3A3A3]">TF-IDF Char Features</div>
              <div className="mt-2 font-mono-tabular text-2xl font-bold text-white">
                {LID_TRAINING_METADATA.tfidf_features.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-[#8E8E8E]">
                {LID_TRAINING_METADATA.training_examples.toLocaleString()} train tokens
              </div>
            </div>
            <div className="rounded-xl border border-[#282828] bg-[#181818] p-4">
              <div className="text-xs text-[#A3A3A3]">Sentence Overlap</div>
              <div className="mt-2 font-mono-tabular text-2xl font-bold text-[#1DB954]">
                {LID_CLEANING_AUDIT.sentence_overlap}
              </div>
              <div className="mt-1 text-[11px] text-[#8E8E8E]">
                Regrouped sentence-disjoint splits
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
