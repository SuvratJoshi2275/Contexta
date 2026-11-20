import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  Loader2,
  Play,
  Sparkles,
} from 'lucide-react';
import type { ConnectionStatus, TranslateResponse } from '../types/contexta';
import { TRANSLATION_RESULTS } from '../data/researchArtifacts';
import { translateEnHi, triggerFileDownload } from '../services/api';
import { formatMetric } from '../utils/nlp';
import {
  ModuleHero,
  OfflineGateBanner,
  ProvenanceBar,
} from '../components/Layout';

interface TranslationStudioViewProps {
  connectionStatus: ConnectionStatus;
  apiBaseUrl: string;
  text: string;
  onTextChange: (t: string) => void;
  result: TranslateResponse | null;
  onResultChange: (r: TranslateResponse | null) => void;
  onRetryConnection: () => void;
  onOpenConnectionModal: () => void;
}

export function TranslationStudioView({
  connectionStatus,
  apiBaseUrl,
  text,
  onTextChange,
  result,
  onResultChange,
  onRetryConnection,
  onOpenConnectionModal,
}: TranslationStudioViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isOnline = connectionStatus === 'online';
  const canRun = isOnline && !loading && text.trim().length > 0;

  const handleTranslate = async () => {
    if (!canRun) return;
    setLoading(true);
    setError(null);
    try {
      const response = await translateEnHi(text, apiBaseUrl);
      onResultChange(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Translation request failed.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHindi = async () => {
    if (!result?.translation_hi) return;
    try {
      await navigator.clipboard.writeText(result.translation_hi);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be restricted
    }
  };

  return (
    <div className="pb-16">
      <ModuleHero
        kicker="Live Inference Lab · POST /api/translate"
        title="Neural Translation Studio"
        subtitle="Experimental English-to-Hindi sequence-to-sequence translation powered by a fine-tuned Helsinki-NLP MarianMT checkpoint."
        metaItems={[
          `Base architecture: ${TRANSLATION_RESULTS.model}`,
          `${TRANSLATION_RESULTS.training_examples.toLocaleString()} fine-tuning pairs`,
          'Experimental research checkpoint',
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pt-8 space-y-6 sm:px-6 lg:px-10">
        {/* Mandatory scientific caveat */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <p className="text-xs leading-relaxed text-amber-100">
            <strong>Experimental Research Model:</strong> Translations from this
            controlled subset MarianMT checkpoint can contain semantic or
            lexical errors and must be verified. Individual translation quality
            scores are never inferred without reference translations.
          </p>
        </div>

        <OfflineGateBanner
          connectionStatus={connectionStatus}
          featureName="Neural Translation Studio"
          endpointPath="POST /api/translate"
          onRetry={onRetryConnection}
          onOpenSettings={onOpenConnectionModal}
        />

        {/* Side-by-side translation studio */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[#282828] bg-[#181818] p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="translation-source-input"
                className="font-display text-base font-bold text-white"
              >
                English Source Sentence
              </label>
              <span className="font-mono-tabular text-xs text-[#8E8E8E]">
                {text.length} chars
              </span>
            </div>
            <textarea
              id="translation-source-input"
              rows={5}
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="The bank approved the loan."
              className="w-full rounded-xl border border-[#323232] bg-[#121212] px-4 py-3 text-sm leading-relaxed text-white placeholder:text-[#666666] focus:border-[#1DB954] focus:outline-none"
            />
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
              onClick={handleTranslate}
              disabled={!canRun}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1DB954] px-6 text-sm font-bold text-black hover:bg-[#1ED760] disabled:cursor-not-allowed disabled:bg-[#2A2A2A] disabled:text-[#737373] transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating Hindi translation…</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>
                    {isOnline ? 'Translate to Hindi' : 'Translate (Backend Offline)'}
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="rounded-xl border border-[#282828] bg-[#181818] p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-base font-bold text-white">
                  Hindi Devanagari Output
                </h2>
                {result && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyHindi}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#343434] bg-[#222222] px-3 text-xs font-medium text-white hover:bg-[#2E2E2E]"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#1DB954]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        triggerFileDownload(
                          JSON.stringify(result, null, 2),
                          'contexta_translation.json',
                          'application/json',
                        )
                      }
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#343434] bg-[#222222] px-3 text-xs font-medium text-white hover:bg-[#2E2E2E]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>JSON</span>
                    </button>
                  </div>
                )}
              </div>

              {result ? (
                <div className="space-y-3">
                  <ProvenanceBar
                    sourceType="live"
                    sourcePath="POST /api/translate"
                    note={result.model}
                  />
                  <div className="min-h-[132px] rounded-xl border border-[#2C2C2C] bg-[#121212] p-4 text-lg leading-relaxed font-medium text-white">
                    {result.translation_hi}
                  </div>
                </div>
              ) : (
                <div className="min-h-[156px] rounded-xl border border-dashed border-[#303030] bg-[#121212] p-6 flex flex-col items-center justify-center text-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#1DB954]" />
                  <p className="text-xs text-[#A3A3A3] max-w-sm">
                    {isOnline
                      ? 'Submit an English sentence to run live MarianMT beam-search translation.'
                      : 'Live translation output appears here when connected to your local FastAPI backend.'}
                  </p>
                </div>
              )}
            </div>

            <p className="text-[11px] text-[#8E8E8E]">
              Beam search: num_beams=2 · max_new_tokens=96 · CPU/local runtime.
            </p>
          </div>
        </div>

        {/* Read-only Historical Translation Benchmark */}
        <section className="space-y-4 border-t border-[#242424] pt-8">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-bold text-white">
              Historical MarianMT Checkpoint Metrics
            </h2>
            <ProvenanceBar
              sourceType="historical"
              sourcePath="research_results/translation_v1/final_translation_results.json"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[#282828] bg-[#181818] p-5">
              <div className="text-xs text-[#A3A3A3]">
                Pretrained Validation (n={TRANSLATION_RESULTS.validation_examples})
              </div>
              <div className="mt-2 font-mono-tabular text-2xl font-bold text-white">
                {formatMetric(TRANSLATION_RESULTS.pretrained_validation.sacrebleu)}{' '}
                <span className="text-xs font-normal text-[#8E8E8E]">BLEU</span>
              </div>
              <div className="mt-1 font-mono-tabular text-xs text-[#B3B3B3]">
                chrF: {formatMetric(TRANSLATION_RESULTS.pretrained_validation.chrf)}
              </div>
            </div>

            <div className="rounded-xl border border-[#282828] bg-[#181818] p-5">
              <div className="text-xs text-[#A3A3A3]">
                Fine-tuned Validation (n={TRANSLATION_RESULTS.validation_examples})
              </div>
              <div className="mt-2 font-mono-tabular text-2xl font-bold text-white">
                {formatMetric(TRANSLATION_RESULTS.finetuned_validation.sacrebleu)}{' '}
                <span className="text-xs font-normal text-[#8E8E8E]">BLEU</span>
              </div>
              <div className="mt-1 font-mono-tabular text-xs text-[#1DB954]">
                chrF: {formatMetric(TRANSLATION_RESULTS.finetuned_validation.chrf)} (+
                {formatMetric(
                  TRANSLATION_RESULTS.finetuned_validation.sacrebleu -
                    TRANSLATION_RESULTS.pretrained_validation.sacrebleu,
                )}{' '}
                BLEU)
              </div>
            </div>

            <div className="rounded-xl border border-[#282828] bg-[#181818] p-5">
              <div className="text-xs text-[#A3A3A3]">
                Fine-tuned Test (n={TRANSLATION_RESULTS.test_examples})
              </div>
              <div className="mt-2 font-mono-tabular text-2xl font-bold text-[#1DB954]">
                {formatMetric(TRANSLATION_RESULTS.finetuned_test.sacrebleu)}{' '}
                <span className="text-xs font-normal text-[#8E8E8E]">BLEU</span>
              </div>
              <div className="mt-1 font-mono-tabular text-xs text-[#B3B3B3]">
                chrF: {formatMetric(TRANSLATION_RESULTS.finetuned_test.chrf)}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
