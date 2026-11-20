import React, { useMemo, useState } from 'react';
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
import {
  EVALUATION_V2_REPORTS,
  LID_FINAL_TEST_METRICS,
  LID_TRAINING_METADATA,
  MODEL_COMPARISON,
  TRANSLATION_RESULTS,
  TRANSLATION_TRAINING_HISTORY,
} from '../data/researchArtifacts';
import { formatMetric, formatPercent } from '../utils/nlp';
import {
  JsonArtifactAccordion,
  ModuleHero,
  ProvenanceBar,
} from '../components/Layout';

type BenchmarkTrack = 'wsd' | 'lid' | 'translation';

export function EvaluationView() {
  const [track, setTrack] = useState<BenchmarkTrack>('wsd');

  const wsdChartData = useMemo(
    () =>
      Object.entries(MODEL_COMPARISON).map(([name, m]) => ({
        name,
        Accuracy: Number((m.accuracy * 100).toFixed(2)),
        'Macro F1': Number((m.macro_f1 * 100).toFixed(2)),
        'Macro Precision': Number((m.macro_precision * 100).toFixed(2)),
        'Macro Recall': Number((m.macro_recall * 100).toFixed(2)),
      })),
    [],
  );

  const translationChartData = useMemo(
    () => [
      {
        stage: 'Pretrained Val',
        sacreBLEU: Number(
          TRANSLATION_RESULTS.pretrained_validation.sacrebleu.toFixed(2),
        ),
        chrF: Number(TRANSLATION_RESULTS.pretrained_validation.chrf.toFixed(2)),
      },
      {
        stage: 'Fine-tuned Val',
        sacreBLEU: Number(
          TRANSLATION_RESULTS.finetuned_validation.sacrebleu.toFixed(2),
        ),
        chrF: Number(TRANSLATION_RESULTS.finetuned_validation.chrf.toFixed(2)),
      },
      {
        stage: 'Fine-tuned Test',
        sacreBLEU: Number(
          TRANSLATION_RESULTS.finetuned_test.sacrebleu.toFixed(2),
        ),
        chrF: Number(TRANSLATION_RESULTS.finetuned_test.chrf.toFixed(2)),
      },
    ],
    [],
  );

  const lidChartData = useMemo(
    () => [
      {
        stage: '6-Class Raw Val',
        Accuracy: Number(
          (LID_TRAINING_METADATA.validation_metrics.accuracy * 100).toFixed(2),
        ),
        'Macro F1': Number(
          (LID_TRAINING_METADATA.validation_metrics.macro_f1 * 100).toFixed(2),
        ),
      },
      {
        stage: '3-Class Normalized Test',
        Accuracy: Number(
          (LID_FINAL_TEST_METRICS.metrics.accuracy * 100).toFixed(2),
        ),
        'Macro F1': Number(
          (LID_FINAL_TEST_METRICS.metrics.macro_f1 * 100).toFixed(2),
        ),
      },
    ],
    [],
  );

  return (
    <div className="pb-16">
      <ModuleHero
        kicker="Historical Evaluation Artifacts · Read-Only"
        title="Evaluation & Benchmarking"
        subtitle="Reported metrics, split boundaries, and model provenance loaded directly from verified saved evaluation JSON artifacts."
        metaItems={[
          'WSD v2 (n=62 test)',
          `Comi-Lingua LID (n=${LID_FINAL_TEST_METRICS.test_tokens.toLocaleString()} test tokens)`,
          `MarianMT En → Hi (n=${TRANSLATION_RESULTS.test_examples} test pairs)`,
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pt-8 space-y-8 sm:px-6 lg:px-10">
        {/* Track switcher */}
        <div
          role="tablist"
          aria-label="Evaluation benchmark track"
          className="inline-flex flex-wrap items-center gap-1 rounded-full border border-[#2A2A2A] bg-[#181818] p-1"
        >
          {[
            { id: 'wsd' as const, label: 'WSD v2 Models' },
            { id: 'lid' as const, label: 'Comi-Lingua LID' },
            { id: 'translation' as const, label: 'MarianMT Translation' },
          ].map((tab) => {
            const active = track === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTrack(tab.id)}
                className={`h-9 rounded-full px-5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#1DB954] text-black'
                    : 'text-[#B3B3B3] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* WSD v2 Track */}
        {track === 'wsd' && (
          <section className="space-y-6">
            <ProvenanceBar
              sourceType="historical"
              sourcePath="research_results/evaluation_v2/model_comparison.json"
              note="Custom wsd_v2_test partition (n=62) · Not an independent open-domain benchmark"
            />

            <div className="rounded-xl border border-[#282828] bg-[#181818] p-6">
              <h2 className="font-display text-lg font-bold text-white mb-4">
                WSD v2 Accuracy & Macro F1 Comparison
              </h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={wsdChartData}
                    margin={{ top: 10, right: 16, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#B3B3B3', fontSize: 11 }}
                      interval={0}
                      angle={-10}
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
            </div>

            <div className="rounded-xl border border-[#282828] bg-[#181818] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#282828] text-[#8E8E8E]">
                    <th className="px-5 py-3.5 font-medium">Model</th>
                    <th className="px-5 py-3.5 text-right font-medium">
                      Accuracy
                    </th>
                    <th className="px-5 py-3.5 text-right font-medium">
                      Macro Precision
                    </th>
                    <th className="px-5 py-3.5 text-right font-medium">
                      Macro Recall
                    </th>
                    <th className="px-5 py-3.5 text-right font-medium">
                      Macro F1
                    </th>
                    <th className="px-5 py-3.5 font-medium">Deployment Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {Object.entries(MODEL_COMPARISON).map(([model, m]) => {
                    const isHistoricalOnly =
                      model === 'Logistic Regression' ||
                      model === 'Residual MLP';
                    return (
                      <tr key={model} className="hover:bg-[#222222]">
                        <td className="px-5 py-3.5 font-semibold text-white">
                          {model}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono-tabular font-semibold text-[#1DB954]">
                          {formatPercent(m.accuracy)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono-tabular text-[#D4D4D4]">
                          {formatPercent(m.macro_precision)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono-tabular text-[#D4D4D4]">
                          {formatPercent(m.macro_recall)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono-tabular font-semibold text-white">
                          {formatPercent(m.macro_f1)}
                        </td>
                        <td className="px-5 py-3.5 text-[#A3A3A3]">
                          {isHistoricalOnly
                            ? 'Historical benchmark only'
                            : 'Active FastAPI inference adapter'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-xs leading-relaxed text-amber-200/90 rounded-xl border border-amber-500/25 bg-amber-500/8 p-4">
              Generalization disclosure: Custom WSD v2 partitions (62 test
              examples across 6 lemmas) are not independent open-domain
              benchmarks. Never interpret 98–100% partition accuracy as
              universal real-world generalization.
            </p>

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
        )}

        {/* LID Track */}
        {track === 'lid' && (
          <section className="space-y-6">
            <ProvenanceBar
              sourceType="historical"
              sourcePath="research_results/senseforge_final/comilingua_lid/training_v1/normalized_3class/final_test_metrics.json"
              note={`Split: ${LID_FINAL_TEST_METRICS.split}`}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7 rounded-xl border border-[#282828] bg-[#181818] p-6">
                <h2 className="font-display text-lg font-bold text-white mb-4">
                  6-Class Raw Validation vs. 3-Class Normalized Test
                </h2>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lidChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
                      <XAxis
                        dataKey="stage"
                        tick={{ fill: '#B3B3B3', fontSize: 12 }}
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
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="Accuracy" fill="#1DB954" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Macro F1" fill="#A78BFA" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-5 rounded-xl border border-[#282828] bg-[#181818] p-6 space-y-4">
                <h3 className="font-display text-base font-bold text-white">
                  Provisional 3-Class Label Mapping
                </h3>
                <div className="divide-y divide-[#262626] text-xs">
                  {Object.entries(LID_FINAL_TEST_METRICS.mapping).map(
                    ([raw, normalized]) => (
                      <div
                        key={raw}
                        className="flex items-center justify-between py-2.5"
                      >
                        <span className="font-mono-tabular text-[#D4D4D4]">
                          {raw}
                        </span>
                        <span className="font-mono-tabular font-semibold text-[#1DB954]">
                          → {normalized}
                        </span>
                      </div>
                    ),
                  )}
                </div>
                <div className="border-t border-[#262626] pt-3 space-y-1.5">
                  <div className="text-xs font-semibold text-white">
                    Recorded Limitations
                  </div>
                  <ul className="space-y-1 text-xs text-[#A3A3A3]">
                    {LID_TRAINING_METADATA.limitations.map((lim) => (
                      <li key={lim}>• {lim}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <JsonArtifactAccordion
              title="Comi-Lingua 3-Class Final Test Metrics"
              sourcePath="research_results/senseforge_final/comilingua_lid/training_v1/normalized_3class/final_test_metrics.json"
              data={LID_FINAL_TEST_METRICS}
            />
          </section>
        )}

        {/* Translation Track */}
        {track === 'translation' && (
          <section className="space-y-6">
            <ProvenanceBar
              sourceType="historical"
              sourcePath="research_results/translation_v1/final_translation_results.json"
              note={`Model: ${TRANSLATION_RESULTS.model}`}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7 rounded-xl border border-[#282828] bg-[#181818] p-6">
                <h2 className="font-display text-lg font-bold text-white mb-4">
                  Pretrained vs. Fine-tuned MarianMT (sacreBLEU & chrF)
                </h2>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={translationChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
                      <XAxis
                        dataKey="stage"
                        tick={{ fill: '#B3B3B3', fontSize: 12 }}
                      />
                      <YAxis tick={{ fill: '#B3B3B3', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#121212',
                          borderColor: '#333333',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="sacreBLEU" fill="#1DB954" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="chrF" fill="#38BDF8" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-5 rounded-xl border border-[#282828] bg-[#181818] p-6 space-y-5">
                <div>
                  <h3 className="font-display text-base font-bold text-white mb-3">
                    Training Epoch History
                  </h3>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#2A2A2A] text-[#8E8E8E]">
                        <th className="py-2 font-medium">Epoch</th>
                        <th className="py-2 text-right font-medium">Loss</th>
                        <th className="py-2 text-right font-medium">Val BLEU</th>
                        <th className="py-2 text-right font-medium">Val chrF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222222]">
                      {TRANSLATION_TRAINING_HISTORY.map((ep) => (
                        <tr key={ep.epoch}>
                          <td className="py-2.5 font-mono-tabular font-semibold text-white">
                            Epoch {ep.epoch}
                          </td>
                          <td className="py-2.5 text-right font-mono-tabular text-[#D4D4D4]">
                            {formatMetric(ep.train_loss, 3)}
                          </td>
                          <td className="py-2.5 text-right font-mono-tabular text-[#1DB954]">
                            {formatMetric(ep.validation_bleu, 2)}
                          </td>
                          <td className="py-2.5 text-right font-mono-tabular text-sky-400">
                            {formatMetric(ep.validation_chrf, 2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-[#262626] pt-4 space-y-2">
                  <div className="text-xs font-semibold text-white">
                    Subset Composition & Limitations
                  </div>
                  <p className="font-mono-tabular text-xs text-[#B3B3B3]">
                    IIT-B: {TRANSLATION_RESULTS.dataset_sources['IIT-B']?.toLocaleString()}{' '}
                    · Samanantar:{' '}
                    {TRANSLATION_RESULTS.dataset_sources['Samanantar']?.toLocaleString()}
                  </p>
                  <ul className="space-y-1 text-xs text-[#A3A3A3]">
                    {TRANSLATION_RESULTS.limitations.map((lim) => (
                      <li key={lim}>• {lim}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <JsonArtifactAccordion
              title="Final MarianMT Translation Results"
              sourcePath="research_results/translation_v1/final_translation_results.json"
              data={TRANSLATION_RESULTS}
            />
          </section>
        )}
      </div>
    </div>
  );
}
