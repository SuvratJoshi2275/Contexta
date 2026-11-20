import React, { useState } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import type {
  ConnectionStatus,
  LiveDatasetsResponse,
} from '../types/contexta';
import {
  FINAL_RESEARCH_MANIFEST,
  LID_CLEANING_AUDIT,
  MULTILINGUAL_DATASET_AUDIT,
} from '../data/researchArtifacts';
import {
  JsonArtifactAccordion,
  ModuleHero,
  ProvenanceBar,
} from '../components/Layout';

interface DatasetIntelligenceViewProps {
  connectionStatus: ConnectionStatus;
  liveDatasets: LiveDatasetsResponse | null;
  onRefreshDatasets: () => void;
}

export function DatasetIntelligenceView({
  connectionStatus,
  liveDatasets,
  onRefreshDatasets,
}: DatasetIntelligenceViewProps) {
  const auditedKeys = Object.keys(MULTILINGUAL_DATASET_AUDIT);
  const [selectedCorpus, setSelectedCorpus] = useState<string>(
    auditedKeys[0] || 'Comi-Lingua',
  );

  const corpusAudit = MULTILINGUAL_DATASET_AUDIT[selectedCorpus];

  return (
    <div className="pb-16">
      <ModuleHero
        kicker="Corpus Audit · GET /api/datasets & Saved Schema Audits"
        title="Dataset Intelligence"
        subtitle="Inspect live local corpus availability from FastAPI alongside verified multilingual dataset schema audits and sentence-disjoint split cleaning records."
        metaItems={[
          'Corpora: Comi-Lingua · IIT-B · Samanantar · XL-WSD',
          `WSD v2 splits: ${FINAL_RESEARCH_MANIFEST.dataset_counts.train} train · ${FINAL_RESEARCH_MANIFEST.dataset_counts.validation} val · ${FINAL_RESEARCH_MANIFEST.dataset_counts.test} test`,
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pt-8 space-y-10 sm:px-6 lg:px-10">
        {/* Live /api/datasets probe */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-white">
                Live Local Corpus Availability
              </h2>
              <ProvenanceBar
                sourceType={connectionStatus === 'online' ? 'live' : 'historical'}
                sourcePath="GET /api/datasets"
                note={
                  connectionStatus === 'online'
                    ? 'Queried from active local FastAPI environment'
                    : 'FastAPI offline · Connect locally to scan configured dataset paths'
                }
              />
            </div>

            {connectionStatus === 'online' && (
              <button
                type="button"
                onClick={onRefreshDatasets}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-[#343434] bg-[#181818] px-4 text-xs font-semibold text-white hover:bg-[#282828]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh Audit</span>
              </button>
            )}
          </div>

          {connectionStatus === 'online' &&
          liveDatasets &&
          Object.keys(liveDatasets).length > 0 ? (
            <div className="rounded-xl border border-[#282828] bg-[#181818] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#282828] text-[#8E8E8E]">
                    <th className="px-5 py-3.5 font-medium">Corpus / Split</th>
                    <th className="px-5 py-3.5 font-medium">Status</th>
                    <th className="px-5 py-3.5 text-right font-medium">Rows</th>
                    <th className="px-5 py-3.5 font-medium">Columns / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {Object.entries(liveDatasets).map(([key, info]) => (
                    <tr key={key} className="hover:bg-[#222222]">
                      <td className="px-5 py-3 font-semibold text-white">
                        {key}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`font-semibold ${
                            info.available ? 'text-[#1DB954]' : 'text-amber-400'
                          }`}
                        >
                          {info.available ? 'Found' : 'Missing'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono-tabular text-[#D4D4D4]">
                        {typeof info.rows === 'number'
                          ? info.rows.toLocaleString()
                          : '—'}
                      </td>
                      <td className="px-5 py-3 text-[#A3A3A3] max-w-md break-words">
                        {info.columns?.join(', ') || info.warning || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-[#282828] bg-[#181818] p-5 flex items-start gap-3.5">
              <Database className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
              <div className="space-y-1 text-xs text-[#B3B3B3]">
                <div className="font-semibold text-white">
                  Live local filesystem audit unavailable in hosted preview
                </div>
                <p>
                  Configure{' '}
                  <code className="font-mono-tabular text-white">
                    SENSEFORGE_DATA_ROOT
                  </code>{' '}
                  or{' '}
                  <code className="font-mono-tabular text-white">
                    CONTEXTA_DATA_ROOT
                  </code>{' '}
                  and run FastAPI locally to inspect live corpus file handles.
                  Below are the verified historical schema audits saved in the
                  repository.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Audited External Corpora (Saved Historical Schema Audit) */}
        <section className="space-y-5">
          <div className="space-y-1.5">
            <h2 className="font-display text-xl font-bold text-white">
              Saved Multilingual Corpus Schema Audit
            </h2>
            <ProvenanceBar
              sourceType="historical"
              sourcePath="research_results/senseforge_final/multilingual_dataset_audit.json"
            />
          </div>

          <div
            role="tablist"
            aria-label="Select audited corpus"
            className="inline-flex flex-wrap items-center gap-1 rounded-full border border-[#2A2A2A] bg-[#181818] p-1"
          >
            {auditedKeys.map((name) => {
              const active = selectedCorpus === name;
              return (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCorpus(name)}
                  className={`h-9 rounded-full px-4 text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#1DB954] text-black'
                      : 'text-[#B3B3B3] hover:text-white'
                  }`}
                >
                  {name} ({MULTILINGUAL_DATASET_AUDIT[name].file_count} files)
                </button>
              );
            })}
          </div>

          {corpusAudit && (
            <div className="rounded-xl border border-[#282828] bg-[#181818] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#282828] text-[#8E8E8E]">
                    <th className="px-5 py-3.5 font-medium">File Name</th>
                    <th className="px-5 py-3.5 text-right font-medium">
                      Size (MB)
                    </th>
                    <th className="px-5 py-3.5 font-medium">Discovered Schema Columns</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {corpusAudit.sample_files.map((file) => (
                    <tr key={file.name} className="hover:bg-[#222222]">
                      <td className="px-5 py-3.5 font-mono-tabular font-medium text-white whitespace-nowrap">
                        {file.name}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono-tabular text-[#D4D4D4] whitespace-nowrap">
                        {file.size_mb.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 font-mono-tabular text-[#A3A3A3] leading-relaxed">
                        {file.columns.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Comi-Lingua Split Cleaning Audit */}
        <section className="space-y-4">
          <div className="space-y-1.5">
            <h2 className="font-display text-xl font-bold text-white">
              Comi-Lingua Sentence-Disjoint Cleaning Audit
            </h2>
            <ProvenanceBar
              sourceType="historical"
              sourcePath="research_results/senseforge_final/comilingua_lid/clean_splits/cleaning_audit.json"
              note={`Sentence overlap: ${LID_CLEANING_AUDIT.sentence_overlap}`}
            />
          </div>

          <div className="rounded-xl border border-[#282828] bg-[#181818] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#282828] text-[#8E8E8E]">
                  <th className="px-5 py-3.5 font-medium">Partition</th>
                  <th className="px-5 py-3.5 text-right font-medium">
                    Original Records
                  </th>
                  <th className="px-5 py-3.5 text-right font-medium">
                    Clean Records
                  </th>
                  <th className="px-5 py-3.5 text-right font-medium">
                    Removed Conflicts/Dups
                  </th>
                  <th className="px-5 py-3.5 text-right font-medium">
                    Unique Sentences
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {(
                  [
                    ['Train', LID_CLEANING_AUDIT.train],
                    ['Validation', LID_CLEANING_AUDIT.validation],
                    ['Test', LID_CLEANING_AUDIT.test],
                  ] as const
                ).map(([label, split]) => (
                  <tr key={label} className="hover:bg-[#222222]">
                    <td className="px-5 py-3.5 font-semibold text-white">
                      {label}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono-tabular text-[#A3A3A3]">
                      {split.original_records.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono-tabular font-semibold text-[#1DB954]">
                      {split.clean_records.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono-tabular text-amber-300">
                      {split.removed_records.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono-tabular text-white">
                      {split.unique_sentences.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#A3A3A3]">
            Conflict policy: {LID_CLEANING_AUDIT.conflict_policy}
          </p>

          <JsonArtifactAccordion
            title="Inspect Raw Multilingual Dataset Audit"
            sourcePath="research_results/senseforge_final/multilingual_dataset_audit.json"
            data={MULTILINGUAL_DATASET_AUDIT}
          />
        </section>
      </div>
    </div>
  );
}
