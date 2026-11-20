import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BENCHMARK_PROTOCOL,
  CALIBRATION_RESULTS,
  CHALLENGE_RESULTS,
  HYBRID_CONFIG,
  LEMMA_RESTRICTION_ABLATION,
} from '../data/researchArtifacts';
import type { PerClassMetrics } from '../types/contexta';
import { formatPercent } from '../utils/nlp';
import {
  JsonArtifactAccordion,
  ModuleHero,
  ProvenanceBar,
} from '../components/Layout';

export function AblationView() {
  const { lemma_restricted: restricted, unrestricted, metadata } =
    LEMMA_RESTRICTION_ABLATION;

  const perSenseComparison = useMemo(() => {
    return HYBRID_CONFIG.sense_labels.map((senseId) => {
      const r = restricted.classification_report[senseId] as
        | PerClassMetrics
        | undefined;
      const u = unrestricted.classification_report[senseId] as
        | PerClassMetrics
        | undefined;
      return {
        sense: senseId,
        Restricted: Number(((r?.['f1-score'] ?? 0) * 100).toFixed(2)),
        Unrestricted: Number(((u?.['f1-score'] ?? 0) * 100).toFixed(2)),
        rPrecision: r?.precision ?? 0,
        rRecall: r?.recall ?? 0,
        uPrecision: u?.precision ?? 0,
        uRecall: u?.recall ?? 0,
        support: r?.support ?? 0,
      };
    });
  }, [restricted, unrestricted]);

  const calibrationChartData = useMemo(
    () =>
      CALIBRATION_RESULTS.results.map((pt) => ({
        threshold: pt.threshold.toFixed(2),
        Accuracy: Number((pt.accuracy * 100).toFixed(2)),
        'Macro F1': Number((pt.macro_f1 * 100).toFixed(2)),
        'Neural Usage': Number((pt.neural_usage * 100).toFixed(2)),
      })),
    [],
  );

  const accGainPp = ((restricted.accuracy - unrestricted.accuracy) * 100).toFixed(2);
  const f1GainPp = ((restricted.macro_f1 - unrestricted.macro_f1) * 100).toFixed(2);

  return (
    <div className="pb-16">
      <ModuleHero
        kicker="Historical Ablation & Calibration Artifacts · Read-Only"
        title="Ablation & Error Analysis"
        subtitle="Quantifying the impact of inference-time lemma class masking, hybrid confidence routing thresholds, and robustness challenge audits."
        metaItems={[
          `Model: ${metadata.model}`,
          `Split: ${metadata.evaluation_split} (n=${metadata.test_examples})`,
          `Operating threshold τ = ${HYBRID_CONFIG.threshold}`,
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pt-8 space-y-10 sm:px-6 lg:px-10">
        {/* Lemma Restriction Ablation */}
        <section className="space-y-5">
          <div className="space-y-1.5">
            <h2 className="font-display text-xl font-bold text-white">
              Inference-Time Lemma-Restriction Masking Study
            </h2>
            <ProvenanceBar
              sourceType="historical"
              sourcePath="research_results/ablation_v2/lemma_restriction_ablation.json"
              note={`${metadata.predictions_changed} predictions changed · model retrained: ${String(metadata.model_retrained)}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-[#282828] bg-[#181818] p-5">
              <div className="text-xs text-[#A3A3A3]">
                Lemma-Restricted Accuracy
              </div>
              <div className="mt-2 font-mono-tabular text-3xl font-bold text-[#1DB954]">
                {formatPercent(restricted.accuracy)}
              </div>
              <div className="mt-1 text-xs text-[#8E8E8E]">
                +{accGainPp}pp vs unrestricted
              </div>
            </div>

            <div className="rounded-xl border border-[#282828] bg-[#181818] p-5">
              <div className="text-xs text-[#A3A3A3]">
                Unrestricted Accuracy
              </div>
              <div className="mt-2 font-mono-tabular text-3xl font-bold text-white">
                {formatPercent(unrestricted.accuracy)}
              </div>
              <div className="mt-1 text-xs text-[#8E8E8E]">
                All 12 classes unmasked at inference
              </div>
            </div>

            <div className="rounded-xl border border-[#282828] bg-[#181818] p-5">
              <div className="text-xs text-[#A3A3A3]">Macro F1 Improvement</div>
              <div className="mt-2 font-mono-tabular text-3xl font-bold text-[#1DB954]">
                +{f1GainPp}pp
              </div>
              <div className="mt-1 font-mono-tabular text-xs text-[#8E8E8E]">
                {formatPercent(unrestricted.macro_f1)} →{' '}
                {formatPercent(restricted.macro_f1)}
              </div>
            </div>

            <div className="rounded-xl border border-[#282828] bg-[#181818] p-5">
              <div className="text-xs text-[#A3A3A3]">Predictions Corrected</div>
              <div className="mt-2 font-mono-tabular text-3xl font-bold text-white">
                {metadata.predictions_changed}
              </div>
              <div className="mt-1 text-xs text-[#8E8E8E]">
                Out of {metadata.test_examples} test instances (zero retraining)
              </div>
            </div>
          </div>

          {/* Per-sense F1 Bar Chart */}
          <div className="rounded-xl border border-[#282828] bg-[#181818] p-6">
            <h3 className="font-display text-base font-bold text-white mb-4">
              Per-Sense F1 Comparison (All 12 Neural Sense Classes)
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={perSenseComparison}
                  margin={{ top: 10, right: 16, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
                  <XAxis
                    dataKey="sense"
                    tick={{ fill: '#B3B3B3', fontSize: 11 }}
                    interval={0}
                    angle={-22}
                    textAnchor="end"
                  />
                  <YAxis
                    domain={[50, 100]}
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
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: '12px', paddingBottom: '12px' }}
                  />
                  <Bar
                    dataKey="Restricted"
                    name="Lemma-Restricted F1"
                    fill="#1DB954"
                    radius={[5, 5, 0, 0]}
                  />
                  <Bar
                    dataKey="Unrestricted"
                    name="Unrestricted F1"
                    fill="#64748B"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Full per-sense table */}
          <div className="rounded-xl border border-[#282828] bg-[#181818] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#282828] text-[#8E8E8E]">
                  <th className="px-5 py-3 font-medium">Sense ID</th>
                  <th className="px-5 py-3 text-right font-medium">Support</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Restricted F1
                  </th>
                  <th className="px-5 py-3 text-right font-medium">
                    Unrestricted F1
                  </th>
                  <th className="px-5 py-3 text-right font-medium">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {perSenseComparison.map((row) => {
                  const delta = row.Restricted - row.Unrestricted;
                  return (
                    <tr key={row.sense} className="hover:bg-[#222222]">
                      <td className="px-5 py-3 font-mono-tabular font-semibold text-white">
                        {row.sense}
                      </td>
                      <td className="px-5 py-3 text-right font-mono-tabular text-[#A3A3A3]">
                        {row.support}
                      </td>
                      <td className="px-5 py-3 text-right font-mono-tabular font-semibold text-[#1DB954]">
                        {row.Restricted.toFixed(2)}%
                      </td>
                      <td className="px-5 py-3 text-right font-mono-tabular text-[#D4D4D4]">
                        {row.Unrestricted.toFixed(2)}%
                      </td>
                      <td
                        className={`px-5 py-3 text-right font-mono-tabular font-semibold ${
                          delta > 0
                            ? 'text-[#1DB954]'
                            : delta < 0
                              ? 'text-rose-400'
                              : 'text-[#8E8E8E]'
                        }`}
                      >
                        {delta > 0 ? `+${delta.toFixed(2)}pp` : `${delta.toFixed(2)}pp`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Hybrid Routing Threshold Sweep */}
        <section className="space-y-5 border-t border-[#242424] pt-8">
          <div className="space-y-1.5">
            <h2 className="font-display text-xl font-bold text-white">
              Hybrid Confidence Threshold Calibration Sweep
            </h2>
            <ProvenanceBar
              sourceType="historical"
              sourcePath="research_results/hybrid_v2/calibration_results.json"
              note={`Split: ${CALIBRATION_RESULTS.selection_split} (n=${HYBRID_CONFIG.validation_examples}) · Confidence type: ${HYBRID_CONFIG.confidence_type}`}
            />
          </div>

          <div className="rounded-xl border border-[#282828] bg-[#181818] p-6 space-y-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={calibrationChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
                  <XAxis
                    dataKey="threshold"
                    tick={{ fill: '#B3B3B3', fontSize: 11 }}
                  />
                  <YAxis
                    domain={[85, 101]}
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
                  <ReferenceLine
                    x={HYBRID_CONFIG.threshold.toFixed(2)}
                    stroke="#1DB954"
                    strokeDasharray="4 4"
                    label={{
                      value: `Operating τ=${HYBRID_CONFIG.threshold}`,
                      fill: '#1DB954',
                      fontSize: 11,
                      position: 'insideTopRight',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Accuracy"
                    stroke="#1DB954"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Macro F1"
                    stroke="#38BDF8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Neural Usage"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-[#A3A3A3]">
              Operating threshold <code className="font-mono-tabular text-white">τ = {HYBRID_CONFIG.threshold}</code>{' '}
              was selected inside the validation tied range (0.50–0.80). Below
              threshold, predictions fall back to deterministic lexical rules
              and dictionary default.
            </p>
          </div>
        </section>

        {/* Robustness Challenge & Independent Benchmark Protocol */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 border-t border-[#242424] pt-8">
          <div className="rounded-xl border border-[#282828] bg-[#181818] p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-lg font-bold text-white">
                Robustness Challenge Audit
              </h2>
              <ProvenanceBar
                sourceType="historical"
                sourcePath="research_results/wsd_robustness/challenge_results.json"
                note={`${CHALLENGE_RESULTS.dataset} · n=${CHALLENGE_RESULTS.examples}`}
              />
            </div>

            <div className="divide-y divide-[#262626] text-xs">
              {Object.entries(CHALLENGE_RESULTS.results).map(([model, m]) => (
                <div key={model} className="py-3 space-y-1.5">
                  <div className="font-semibold text-white">{model}</div>
                  <div className="grid grid-cols-4 gap-2 font-mono-tabular text-[#B3B3B3]">
                    <div>Acc: {formatPercent(m.accuracy)}</div>
                    <div>Prec: {formatPercent(m.macro_precision)}</div>
                    <div>Rec: {formatPercent(m.macro_recall)}</div>
                    <div className="text-[#1DB954]">
                      F1: {formatPercent(m.macro_f1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#282828] bg-[#181818] p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-lg font-bold text-white">
                Independent Benchmark Protocol
              </h2>
              <ProvenanceBar
                sourceType="historical"
                sourcePath="research_results/wsd_independent_benchmark/benchmark_protocol.json"
              />
            </div>

            <div className="space-y-2 text-xs">
              {Object.entries(BENCHMARK_PROTOCOL.evaluation_tracks).map(
                ([trackName, info]) => (
                  <div
                    key={trackName}
                    className="flex items-center justify-between rounded-lg border border-[#262626] bg-[#121212] px-3.5 py-2.5"
                  >
                    <span className="font-mono-tabular text-white">
                      {trackName}
                    </span>
                    <span
                      className={`font-semibold ${
                        info.status === 'not_collected'
                          ? 'text-amber-400'
                          : 'text-[#B3B3B3]'
                      }`}
                    >
                      {info.status}
                      {info.records ? ` (${info.records})` : ''}
                    </span>
                  </div>
                ),
              )}
            </div>

            <div className="pt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#8E8E8E]">
              {Object.entries(BENCHMARK_PROTOCOL.restrictions).map(
                ([rule, active]) => (
                  <span key={rule}>
                    {rule}: {active ? 'enforced' : 'off'}
                  </span>
                ),
              )}
            </div>
          </div>
        </section>

        <div className="space-y-3">
          <JsonArtifactAccordion
            title="Lemma-Restriction Ablation JSON"
            sourcePath="research_results/ablation_v2/lemma_restriction_ablation.json"
            data={LEMMA_RESTRICTION_ABLATION}
          />
          <JsonArtifactAccordion
            title="Hybrid Config JSON"
            sourcePath="research_results/hybrid_v2/hybrid_config.json"
            data={HYBRID_CONFIG}
          />
        </div>
      </div>
    </div>
  );
}
