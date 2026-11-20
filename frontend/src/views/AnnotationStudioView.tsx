import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import type {
  AnnotationsResponse,
  CandidateItem,
  ConnectionStatus,
  InventoryMap,
} from '../types/contexta';
import {
  fetchAnnotations,
  fetchCandidates,
  saveAnnotation,
  triggerFileDownload,
} from '../services/api';
import {
  ModuleHero,
  OfflineGateBanner,
} from '../components/Layout';

interface AnnotationStudioViewProps {
  inventory: InventoryMap;
  connectionStatus: ConnectionStatus;
  apiBaseUrl: string;
  onNotify: (msg: string, tone?: 'success' | 'error') => void;
  onRetryConnection: () => void;
  onOpenConnectionModal: () => void;
}

export function AnnotationStudioView({
  inventory,
  connectionStatus,
  apiBaseUrl,
  onNotify,
  onRetryConnection,
  onOpenConnectionModal,
}: AnnotationStudioViewProps) {
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [queueMessage, setQueueMessage] = useState<string | null>(null);
  const [annotationsData, setAnnotationsData] =
    useState<AnnotationsResponse | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const [annotator, setAnnotator] = useState('');
  const [selectedSense, setSelectedSense] = useState('');
  const [reviewStatus, setReviewStatus] = useState<
    'reviewed' | 'pending' | 'disputed'
  >('reviewed');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOnline = connectionStatus === 'online';

  const loadQueue = async () => {
    if (!isOnline) return;
    setLoading(true);
    setError(null);
    try {
      const [candRes, annRes] = await Promise.all([
        fetchCandidates(0, 50, apiBaseUrl),
        fetchAnnotations(apiBaseUrl),
      ]);
      setCandidates(candRes.items || []);
      setQueueMessage(candRes.message || null);
      setAnnotationsData(annRes);
      setQueueIndex(0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load annotation candidates.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOnline) {
      void loadQueue();
    }
  }, [isOnline, apiBaseUrl]);

  const currentItem = candidates[queueIndex] ?? null;
  const currentWord = String(
    currentItem?.word || currentItem?.lemma || '',
  ).toLowerCase();
  const senses = currentWord ? inventory[currentWord]?.senses ?? [] : [];

  useEffect(() => {
    setSelectedSense(senses[0]?.id ?? '');
  }, [queueIndex, currentWord]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline || !currentItem) return;
    if (!annotator.trim()) {
      setError('Annotator identity is required before saving.');
      return;
    }
    if (!selectedSense) {
      setError('Select a verified sense label.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await saveAnnotation(
        {
          item_id: String(currentItem.item_id || currentItem.id || ''),
          word: currentWord,
          sense_id: selectedSense,
          annotator: annotator.trim(),
          status: reviewStatus,
        },
        apiBaseUrl,
      );
      onNotify('Annotation saved through FastAPI backend.', 'success');
      const updated = await fetchAnnotations(apiBaseUrl);
      setAnnotationsData(updated);
      if (queueIndex < candidates.length - 1) {
        setQueueIndex((i) => i + 1);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to save annotation.';
      setError(msg);
      onNotify(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-16">
      <ModuleHero
        kicker="Human-in-the-Loop · GET/POST /api/candidates & /api/annotations"
        title="Annotation Studio"
        subtitle="Review extracted ambiguous context candidates, assign verified Hindi sense labels, and export gold-standard adjudication records."
        metaItems={[
          'Protocol: 2 independent human agreements or explicit adjudication',
          'Backed by persistent SQLite annotation module',
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pt-8 space-y-6 sm:px-6 lg:px-10">
        <OfflineGateBanner
          connectionStatus={connectionStatus}
          featureName="Annotation Studio"
          endpointPath="GET /api/candidates · POST /api/annotations"
          onRetry={onRetryConnection}
          onOpenSettings={onOpenConnectionModal}
        />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#A3A3A3]">
            {isOnline ? (
              <>
                Queue:{' '}
                <span className="font-mono-tabular text-white font-semibold">
                  {candidates.length}
                </span>{' '}
                candidates · Saved records:{' '}
                <span className="font-mono-tabular text-white font-semibold">
                  {annotationsData?.records?.length ?? 0}
                </span>{' '}
                · Gold:{' '}
                <span className="font-mono-tabular text-[#1DB954] font-semibold">
                  {annotationsData?.gold?.length ?? 0}
                </span>
              </>
            ) : (
              'Connect local FastAPI backend to load artifacts/candidates.jsonl and persist annotations.'
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => void loadQueue()}
              disabled={!isOnline || loading}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-[#343434] bg-[#181818] px-4 text-xs font-semibold text-white hover:bg-[#282828] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
              />
              <span>Reload Queue</span>
            </button>
            <button
              type="button"
              disabled={!annotationsData}
              onClick={() =>
                annotationsData &&
                triggerFileDownload(
                  JSON.stringify(annotationsData, null, 2),
                  'contexta_annotations.json',
                  'application/json',
                )
              }
              className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-black hover:bg-[#E5E5E5] disabled:cursor-not-allowed disabled:bg-[#2A2A2A] disabled:text-[#737373]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Annotations JSON</span>
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200"
          >
            {error}
          </div>
        )}

        {isOnline && currentItem ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Candidate context panel */}
            <div className="lg:col-span-7 rounded-xl border border-[#282828] bg-[#181818] p-6 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-[#A3A3A3]">
                  Candidate{' '}
                  <span className="font-mono-tabular font-semibold text-white">
                    {queueIndex + 1} / {candidates.length}
                  </span>
                  {currentItem.source ? ` · ${currentItem.source}` : ''}
                  {currentItem.split ? ` · ${currentItem.split}` : ''}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={queueIndex <= 0}
                    onClick={() => setQueueIndex((i) => Math.max(0, i - 1))}
                    aria-label="Previous candidate"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#343434] bg-[#121212] text-white hover:bg-[#282828] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={queueIndex >= candidates.length - 1}
                    onClick={() =>
                      setQueueIndex((i) => Math.min(candidates.length - 1, i + 1))
                    }
                    aria-label="Next candidate"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#343434] bg-[#121212] text-white hover:bg-[#282828] disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-[#282828] bg-[#121212] p-5 space-y-2">
                <div className="font-mono-tabular text-xs text-[#1DB954]">
                  Target lemma: {currentWord || 'unknown'} · ID:{' '}
                  {String(currentItem.item_id || currentItem.id || '—')}
                </div>
                <p className="text-base leading-relaxed text-white">
                  {currentItem.text}
                </p>
              </div>
            </div>

            {/* Review submission form */}
            <form
              onSubmit={handleSave}
              className="lg:col-span-5 rounded-xl border border-[#282828] bg-[#181818] p-6 space-y-4"
            >
              <h2 className="font-display text-lg font-bold text-white">
                Assign Verified Sense
              </h2>

              <div>
                <label
                  htmlFor="annotation-annotator-id"
                  className="block text-xs font-semibold text-[#D4D4D4] mb-1.5"
                >
                  Annotator identity
                </label>
                <input
                  id="annotation-annotator-id"
                  type="text"
                  value={annotator}
                  onChange={(e) => setAnnotator(e.target.value)}
                  placeholder="e.g. annotator_01"
                  className="w-full rounded-lg border border-[#323232] bg-[#121212] px-3.5 py-2.5 text-sm text-white placeholder:text-[#666666] focus:border-[#1DB954] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="annotation-sense-select"
                  className="block text-xs font-semibold text-[#D4D4D4] mb-1.5"
                >
                  Verified sense label
                </label>
                <select
                  id="annotation-sense-select"
                  value={selectedSense}
                  onChange={(e) => setSelectedSense(e.target.value)}
                  className="w-full rounded-lg border border-[#323232] bg-[#121212] px-3.5 py-2.5 text-sm text-white focus:border-[#1DB954] focus:outline-none"
                >
                  <option value="">Choose verified sense…</option>
                  {senses.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#181818]">
                      {s.id}: {s.hindi} — {s.definition}
                    </option>
                  ))}
                  <option value="uncertain" className="bg-[#181818]">
                    uncertain
                  </option>
                  <option value="other" className="bg-[#181818]">
                    other
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="annotation-status-select"
                  className="block text-xs font-semibold text-[#D4D4D4] mb-1.5"
                >
                  Review status
                </label>
                <select
                  id="annotation-status-select"
                  value={reviewStatus}
                  onChange={(e) =>
                    setReviewStatus(
                      e.target.value as 'reviewed' | 'pending' | 'disputed',
                    )
                  }
                  className="w-full rounded-lg border border-[#323232] bg-[#121212] px-3.5 py-2.5 text-sm text-white focus:border-[#1DB954] focus:outline-none"
                >
                  <option value="reviewed">reviewed</option>
                  <option value="pending">pending</option>
                  <option value="disputed">disputed</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving || !isOnline}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1DB954] px-6 text-sm font-bold text-black hover:bg-[#1ED760] disabled:cursor-not-allowed disabled:bg-[#2A2A2A] disabled:text-[#737373]"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving review…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Save Annotation</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#303030] bg-[#181818] p-10 text-center space-y-2.5">
            <CheckCircle2 className="mx-auto h-6 w-6 text-[#1DB954]" />
            <h3 className="font-display text-base font-bold text-white">
              {isOnline
                ? 'No Active Annotation Candidates Found'
                : 'Annotation Queue Requires Local FastAPI'}
            </h3>
            <p className="mx-auto max-w-md text-xs leading-relaxed text-[#A3A3A3]">
              {isOnline
                ? queueMessage ||
                  'Restore artifacts/candidates.jsonl from Notebook 03 ambiguity extraction to begin reviewing candidates.'
                : 'Annotation review writes directly to the local SQLite annotation store through POST /api/annotations. Start FastAPI locally to load candidates and save reviews.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
