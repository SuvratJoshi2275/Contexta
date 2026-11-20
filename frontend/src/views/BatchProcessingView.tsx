import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Loader2,
  Play,
  Upload,
} from 'lucide-react';
import type {
  BatchResultRow,
  ConnectionStatus,
  InferenceMethod,
  InventoryMap,
} from '../types/contexta';
import {
  identifyLanguages,
  predictSense,
  triggerFileDownload,
  uploadBatchCsv,
} from '../services/api';
import {
  detectInventorySpans,
  parseCsvText,
  serializeCsv,
} from '../utils/nlp';
import {
  ModuleHero,
  OfflineGateBanner,
} from '../components/Layout';

interface BatchProcessingViewProps {
  inventory: InventoryMap;
  connectionStatus: ConnectionStatus;
  apiBaseUrl: string;
  results: BatchResultRow[];
  onResultsChange: (rows: BatchResultRow[]) => void;
  onRetryConnection: () => void;
  onOpenConnectionModal: () => void;
}

type BatchExecutionMode = 'per_row_method' | 'fast_api_batch';

export function BatchProcessingView({
  inventory,
  connectionStatus,
  apiBaseUrl,
  results,
  onResultsChange,
  onRetryConnection,
  onOpenConnectionModal,
}: BatchProcessingViewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<Array<Record<string, string>>>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [execMode, setExecMode] = useState<BatchExecutionMode>('per_row_method');
  const [method, setMethod] = useState<InferenceMethod>('hybrid');
  const [includeLid, setIncludeLid] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [runError, setRunError] = useState<string | null>(null);

  const isOnline = connectionStatus === 'online';
  const maxRows = execMode === 'per_row_method' ? 250 : 1000;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    setParseError(null);
    setRunError(null);
    if (!picked) return;

    if (picked.size > 5_000_000) {
      setFile(null);
      setPreviewRows([]);
      setParseError('File exceeds the 5 MB CSV limit.');
      return;
    }

    try {
      const content = await picked.text();
      const parsed = parseCsvText(content, maxRows);
      if (parsed.error) {
        setFile(null);
        setPreviewRows([]);
        setParseError(parsed.error);
        return;
      }
      setFile(picked);
      setPreviewRows(parsed.rows);
    } catch {
      setFile(null);
      setPreviewRows([]);
      setParseError('Unable to read file as UTF-8 CSV.');
    }
  };

  const handleExecute = async () => {
    if (!isOnline || !file || previewRows.length === 0 || running) return;
    setRunning(true);
    setRunError(null);
    setProgress(0);

    try {
      if (execMode === 'fast_api_batch') {
        const res = await uploadBatchCsv(file, apiBaseUrl);
        onResultsChange(res.rows);
        setProgress(100);
      } else {
        const out: BatchResultRow[] = [];
        for (let i = 0; i < previewRows.length; i += 1) {
          const row = previewRows[i];
          const text = row.text || '';
          let word = (row.word || '').trim().toLowerCase() || null;
          if (!word) {
            const spans = detectInventorySpans(text, inventory);
            word = spans[0]?.word ?? null;
          }

          try {
            if (!word) {
              throw new Error('No supported inventory lemma detected');
            }
            const pred = await predictSense(
              { text, word, method },
              apiBaseUrl,
            );
            let lidSummary: string | undefined;
            if (includeLid) {
              const lidRes = await identifyLanguages(text, apiBaseUrl);
              lidSummary = lidRes.tokens
                .map((t) => `${t.token}:${t.language}`)
                .join(' ');
            }
            out.push({
              ...row,
              text,
              word,
              sense_id: pred.sense_id,
              hindi: pred.hindi,
              definition: pred.definition,
              method: pred.method,
              status: pred.status,
              confidence: pred.confidence,
              ...(includeLid ? { lid_summary: lidSummary } : {}),
              error: '',
            });
          } catch (err) {
            out.push({
              ...row,
              text,
              word: word ?? '',
              sense_id: '',
              hindi: '',
              error: err instanceof Error ? err.message : 'Row inference error',
            });
          }
          setProgress(Math.round(((i + 1) / previewRows.length) * 100));
        }
        onResultsChange(out);
      }
    } catch (err) {
      setRunError(
        err instanceof Error ? err.message : 'Batch execution failed.',
      );
    } finally {
      setRunning(false);
    }
  };

  const handleDownloadCsv = () => {
    const csv = serializeCsv(results);
    triggerFileDownload(csv, 'contexta_batch_predictions.csv', 'text/csv');
  };

  return (
    <div className="pb-16">
      <ModuleHero
        kicker="Live Batch Pipeline · POST /api/predict & POST /api/batch"
        title="Batch Processing"
        subtitle="Validate UTF-8 CSV corpora locally and execute resource-bounded WSD and optional LID inference through the live FastAPI backend."
        metaItems={[
          'Required column: text · Optional column: word',
          '5 MB file cap · 250 rows (per-row method) / 1,000 rows (/api/batch)',
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pt-8 space-y-6 sm:px-6 lg:px-10">
        <OfflineGateBanner
          connectionStatus={connectionStatus}
          featureName="Batch CSV Inference"
          endpointPath="POST /api/batch & POST /api/predict"
          onRetry={onRetryConnection}
          onOpenSettings={onOpenConnectionModal}
        />

        {/* Upload & configuration card */}
        <div className="rounded-xl border border-[#282828] bg-[#181818] p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* File upload zone */}
            <div className="lg:col-span-6 space-y-3">
              <label
                htmlFor="batch-csv-upload"
                className="block text-xs font-semibold text-[#D4D4D4]"
              >
                Upload UTF-8 CSV file (schema validated locally)
              </label>
              <label
                htmlFor="batch-csv-upload"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#383838] bg-[#121212] px-6 py-8 text-center hover:border-[#1DB954] transition-colors"
              >
                <Upload className="h-5 w-5 text-[#1DB954]" />
                <div className="text-sm font-semibold text-white">
                  {file ? file.name : 'Choose UTF-8 CSV file'}
                </div>
                <div className="text-xs text-[#8E8E8E]">
                  {file
                    ? `${previewRows.length} rows validated · ${(file.size / 1024).toFixed(1)} KB`
                    : 'Must contain a "text" header and optional "word" header'}
                </div>
                <input
                  id="batch-csv-upload"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              {parseError && (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200"
                >
                  {parseError}
                </div>
              )}
            </div>

            {/* Execution options */}
            <div className="lg:col-span-6 space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#D4D4D4]">
                  Execution route
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      id: 'per_row_method' as const,
                      title: 'Per-Row Method + LID',
                      desc: 'POST /api/predict (max 250 rows)',
                    },
                    {
                      id: 'fast_api_batch' as const,
                      title: 'Direct CSV Batch',
                      desc: 'POST /api/batch (max 1,000 rows)',
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setExecMode(opt.id)}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        execMode === opt.id
                          ? 'border-[#1DB954] bg-[#1DB954]/12 text-white'
                          : 'border-[#2E2E2E] bg-[#121212] text-[#B3B3B3] hover:bg-[#222222]'
                      }`}
                    >
                      <div className="text-xs font-semibold">{opt.title}</div>
                      <div className="mt-0.5 font-mono-tabular text-[11px] text-[#8E8E8E]">
                        {opt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {execMode === 'per_row_method' && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="batch-method-select"
                      className="block text-xs font-semibold text-[#D4D4D4] mb-1.5"
                    >
                      Inference method
                    </label>
                    <select
                      id="batch-method-select"
                      value={method}
                      onChange={(e) =>
                        setMethod(e.target.value as InferenceMethod)
                      }
                      className="w-full rounded-lg border border-[#323232] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#1DB954] focus:outline-none"
                    >
                      <option value="hybrid">hybrid (XLM-R LoRA + rule)</option>
                      <option value="rule">rule</option>
                      <option value="dictionary">dictionary</option>
                      <option value="neural">neural (6-lemma LoRA)</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-xs text-[#CCCCCC] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeLid}
                        onChange={(e) => setIncludeLid(e.target.checked)}
                        className="h-4 w-4 rounded accent-[#1DB954]"
                      />
                      <span>Also run Comi-Lingua LID</span>
                    </label>
                  </div>
                </div>
              )}

              {runError && (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200"
                >
                  {runError}
                </div>
              )}

              <button
                type="button"
                onClick={handleExecute}
                disabled={!isOnline || !file || previewRows.length === 0 || running}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1DB954] px-6 text-sm font-bold text-black hover:bg-[#1ED760] disabled:cursor-not-allowed disabled:bg-[#2A2A2A] disabled:text-[#737373] transition-colors"
              >
                {running ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing batch ({progress}%)…</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>
                      {isOnline
                        ? `Run Batch Inference (${previewRows.length} rows)`
                        : 'Run Batch Inference (Backend Offline)'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {running && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#282828]">
              <div
                className="h-full bg-[#1DB954] transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Local CSV Preview (before execution) */}
          {previewRows.length > 0 && results.length === 0 && (
            <div className="space-y-3 border-t border-[#242424] pt-5">
              <div className="text-xs font-semibold text-[#D4D4D4]">
                Validated Input Preview (first {Math.min(10, previewRows.length)}{' '}
                of {previewRows.length} rows)
              </div>
              <div className="overflow-x-auto rounded-lg border border-[#262626] bg-[#121212]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#262626] text-[#8E8E8E]">
                      <th className="px-4 py-2.5 font-medium">#</th>
                      <th className="px-4 py-2.5 font-medium">text</th>
                      <th className="px-4 py-2.5 font-medium">word</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202020]">
                    {previewRows.slice(0, 10).map((r, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 font-mono-tabular text-[#8E8E8E]">
                          {i + 1}
                        </td>
                        <td className="px-4 py-2 text-white">{r.text}</td>
                        <td className="px-4 py-2 font-mono-tabular text-[#1DB954]">
                          {r.word || '(auto-detect)'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Live Batch Results */}
        {results.length > 0 ? (
          <div className="rounded-xl border border-[#282828] bg-[#181818] p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  Batch Inference Results
                </h2>
                <p className="text-xs text-[#A3A3A3]">
                  {results.length} rows processed via live FastAPI backend.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1DB954] px-5 text-xs font-bold text-black hover:bg-[#1ED760]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Results CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#262626] bg-[#121212]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#262626] text-[#8E8E8E]">
                    <th className="px-4 py-3 font-medium">Text</th>
                    <th className="px-4 py-3 font-medium">Word</th>
                    <th className="px-4 py-3 font-medium">Sense ID</th>
                    <th className="px-4 py-3 font-medium">Hindi</th>
                    <th className="px-4 py-3 font-medium">Status / Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202020]">
                  {results.slice(0, 50).map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#1D1D1D]">
                      <td className="px-4 py-2.5 text-white max-w-md break-words">
                        {row.text}
                      </td>
                      <td className="px-4 py-2.5 font-mono-tabular text-[#D4D4D4]">
                        {row.word || '—'}
                      </td>
                      <td className="px-4 py-2.5 font-mono-tabular text-[#1DB954]">
                        {row.sense_id || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-white">
                        {row.hindi || '—'}
                      </td>
                      <td
                        className={`px-4 py-2.5 ${
                          row.error ? 'text-rose-400' : 'text-[#A3A3A3]'
                        }`}
                      >
                        {row.error || row.status || 'ok'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#303030] bg-[#181818] p-10 text-center space-y-2">
            <FileSpreadsheet className="mx-auto h-5 w-5 text-[#1DB954]" />
            <p className="text-xs text-[#A3A3A3]">
              Upload a UTF-8 CSV file above to inspect its schema immediately.
              Live batch predictions will render here once executed against
              FastAPI.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
