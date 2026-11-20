import React, { useMemo, useState } from 'react';
import { BookMarked, Search } from 'lucide-react';
import type { ConnectionStatus } from '../types/contexta';
import {
  ARCHIVAL_CODE_MIXED_RECORD,
  ARCHIVAL_INTEGRATION_RECORDS,
  ARCHIVAL_TRANSLATION_RECORD,
  FINAL_RESEARCH_MANIFEST,
  INTEGRATION_SUMMARY,
  NOTEBOOKS_MANIFEST,
  REGRESSION_CHECKS,
} from '../data/researchArtifacts';
import { formatPercent } from '../utils/nlp';
import {
  JsonArtifactAccordion,
  ModuleHero,
  ProvenanceBar,
} from '../components/Layout';

interface ExperimentsRegistryViewProps {
  connectionStatus: ConnectionStatus;
  liveExperiments: Record<string, unknown> | null;
}

function inferNotebookStage(name: string): string {
  const num = parseInt(name.slice(0, 2), 10);
  if (num <= 4) return 'Data & Annotation';
  if (num <= 6) return 'Baselines';
  if (num <= 10) return 'Neural & Hybrid Training';
  if (num <= 16) return 'Evaluation & Robustness';
  return 'End-to-End Integration';
}

export function ExperimentsRegistryView({
  connectionStatus,
  liveExperiments,
}: ExperimentsRegistryViewProps) {
  const [nbFilter, setNbFilter] = useState('');

  const filteredNotebooks = useMemo(() => {
    const q = nbFilter.trim().toLowerCase();
    if (!q) return NOTEBOOKS_MANIFEST;
    return NOTEBOOKS_MANIFEST.filter(
      (nb) =>
        nb.name.toLowerCase().includes(q) ||
        inferNotebookStage(nb.name).toLowerCase().includes(q),
    );
  }, [nbFilter]);

  return (
    <div className="pb-16">
      <ModuleHero
        kicker="Reproducibility & Lineage · Notebooks 01–20"
        title="Experiments & Research Registry"
        subtitle="Complete 20-notebook experimental lineage, live report discovery, saved alignment regression checks, and read-only Notebook 20 archival records."
        metaItems={[
          `${NOTEBOOKS_MANIFEST.length} research notebooks`,
          `Regression checks: ${REGRESSION_CHECKS.sense_metadata}`,
          'No model weights bundled in preview',
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pt-8 space-y-10 sm:px-6 lg:px-10">
        {/* 20-Notebook Lineage Table */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-white">
                20-Notebook Research Pipeline Lineage
              </h2>
              <ProvenanceBar
                sourceType="historical"
                sourcePath="notebooks/01_*.ipynb → notebooks/20_*.ipynb"
              />
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8E8E]"
              />
              <input
                type="search"
                value={nbFilter}
                onChange={(e) => setNbFilter(e.target.value)}
                aria-label="Filter notebooks by name or stage"
                placeholder="Filter notebooks or stage…"
                className="h-10 w-full rounded-full border border-[#323232] bg-[#181818] pl-10 pr-4 text-xs text-white placeholder:text-[#7A7A7A] focus:border-[#1DB954] focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#282828] bg-[#181818] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#282828] text-[#8E8E8E]">
                  <th className="px-5 py-3 font-medium w-16">#</th>
                  <th className="px-5 py-3 font-medium">Notebook</th>
                  <th className="px-5 py-3 font-medium">Pipeline Stage</th>
                  <th className="px-5 py-3 text-right font-medium">Size (KB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {filteredNotebooks.map((nb) => {
                  const num = nb.name.slice(0, 2);
                  return (
                    <tr key={nb.name} className="hover:bg-[#222222]">
                      <td className="px-5 py-3 font-mono-tabular text-[#1DB954] font-semibold">
                        {num}
                      </td>
                      <td className="px-5 py-3 font-mono-tabular text-white">
                        {nb.name}
                      </td>
                      <td className="px-5 py-3 text-[#B3B3B3]">
                        {inferNotebookStage(nb.name)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono-tabular text-[#A3A3A3]">
                        {nb.size_kb.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Live FastAPI /api/experiments Discovery */}
        {connectionStatus === 'online' &&
          liveExperiments &&
          Object.keys(liveExperiments).length > 0 && (
            <section className="space-y-3 border-t border-[#242424] pt-8">
              <div className="space-y-1">
                <h2 className="font-display text-xl font-bold text-white">
                  Live Local Reports Directory
                </h2>
                <ProvenanceBar
                  sourceType="live"
                  sourcePath="GET /api/experiments"
                />
              </div>
              {Object.entries(liveExperiments).map(([file, payload]) => (
                <JsonArtifactAccordion
                  key={file}
                  title={file}
                  sourcePath={`reports/${file}`}
                  data={payload}
                />
              ))}
            </section>
          )}

        {/* Archival Notebook 20 End-to-End Integration Records */}
        <section className="space-y-4 border-t border-[#242424] pt-8">
          <div className="space-y-1.5">
            <h2 className="font-display text-xl font-bold text-white">
              Archival Notebook 20 Integration Records
            </h2>
            <ProvenanceBar
              sourceType="historical"
              sourcePath="research_results/senseforge_end_to_end/integration_demo_results.json"
              note="Saved offline notebook output · Strictly archival, not live model inference"
            />
          </div>

          <div className="rounded-xl border border-[#282828] bg-[#181818] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#282828] text-[#8E8E8E]">
                  <th className="px-5 py-3 font-medium">Recorded Input</th>
                  <th className="px-5 py-3 font-medium">Target</th>
                  <th className="px-5 py-3 font-medium">Sense / Hindi</th>
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Raw Conf.*
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {ARCHIVAL_INTEGRATION_RECORDS.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-[#222222]">
                    <td className="px-5 py-3 text-white">{rec.input_text}</td>
                    <td className="px-5 py-3 font-mono-tabular text-[#D4D4D4]">
                      {rec.target_word} [{rec.target_span[0]}–{rec.target_span[1]}]
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-semibold text-[#1DB954]">
                        {rec.hindi_meaning}
                      </span>{' '}
                      <span className="font-mono-tabular text-[#8E8E8E]">
                        ({rec.sense_id})
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono-tabular text-[#A3A3A3]">
                      {rec.prediction_method}
                    </td>
                    <td className="px-5 py-3 text-right font-mono-tabular text-[#D4D4D4]">
                      {rec.neural_confidence !== null
                        ? formatPercent(rec.neural_confidence)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#8E8E8E]">
            *Archival Notebook 20 integration demonstrations are not independent
            benchmarks, and softmax confidence values are uncalibrated.
          </p>

          <div className="space-y-3">
            <JsonArtifactAccordion
              title="Final Research Manifest (Notebook 17)"
              sourcePath="research_results/senseforge_final/final_research_manifest.json"
              data={FINAL_RESEARCH_MANIFEST}
            />
            <JsonArtifactAccordion
              title="Regression & Span Alignment Checks"
              sourcePath="research_results/senseforge_final/regression_checks.json"
              data={REGRESSION_CHECKS}
            />
            <JsonArtifactAccordion
              title="Archival Code-Mixed Integration Record"
              sourcePath="research_results/senseforge_end_to_end/code_mixed_demo.json"
              data={ARCHIVAL_CODE_MIXED_RECORD}
            />
            <JsonArtifactAccordion
              title="Archival Translation Integration Record"
              sourcePath="research_results/senseforge_end_to_end/translation_demo.json"
              data={ARCHIVAL_TRANSLATION_RECORD}
            />
          </div>

          <div className="rounded-xl border border-[#282828] bg-[#181818] p-5 flex items-start gap-3">
            <BookMarked className="h-4 w-4 shrink-0 text-[#1DB954] mt-0.5" />
            <p className="text-xs leading-relaxed text-[#A3A3A3]">
              Missing model weights in a lightweight handoff package cannot be
              used for live inference. Restore the trained XLM-R LoRA,
              Comi-Lingua LID, and MarianMT checkpoints locally on your Mac and
              start FastAPI on <code className="font-mono-tabular text-white">127.0.0.1:8000</code>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
