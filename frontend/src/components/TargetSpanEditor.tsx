import React, { useMemo } from 'react';
import type { InventoryMap, TargetSpanMatch } from '../types/contexta';
import { NEURAL_SUPPORTED_WORDS } from '../data/researchArtifacts';
import {
  buildHighlightedSegments,
  detectInventorySpans,
} from '../utils/nlp';

interface TargetSpanEditorProps {
  idPrefix: string;
  text: string;
  onTextChange: (next: string) => void;
  selectedSpanIndex: number;
  onSelectSpanIndex: (idx: number) => void;
  inventory: InventoryMap;
  label?: string;
  placeholder?: string;
}

export function TargetSpanEditor({
  idPrefix,
  text,
  onTextChange,
  selectedSpanIndex,
  onSelectSpanIndex,
  inventory,
  label = 'Context sentence (English or Hinglish)',
  placeholder = 'Enter a sentence containing one of the curated ambiguous lemmas…',
}: TargetSpanEditorProps) {
  const spans: TargetSpanMatch[] = useMemo(
    () => detectInventorySpans(text, inventory),
    [text, inventory],
  );

  const safeIndex =
    spans.length === 0 ? -1 : Math.min(selectedSpanIndex, spans.length - 1);

  const segments = useMemo(
    () => buildHighlightedSegments(text, spans),
    [text, spans],
  );

  const neuralSet = useMemo(
    () => new Set(NEURAL_SUPPORTED_WORDS.map((w) => w.toLowerCase())),
    [],
  );

  const selectedSpan = safeIndex >= 0 ? spans[safeIndex] : null;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <label
            htmlFor={`${idPrefix}-sentence`}
            className="text-xs font-semibold text-[#D4D4D4]"
          >
            {label}
          </label>
          <span className="font-mono-tabular text-[11px] text-[#8E8E8E]">
            {spans.length} inventory{' '}
            {spans.length === 1 ? 'occurrence' : 'occurrences'} detected
          </span>
        </div>
        <textarea
          id={`${idPrefix}-sentence`}
          rows={3}
          value={text}
          onChange={(e) => {
            onTextChange(e.target.value);
            onSelectSpanIndex(0);
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-[#323232] bg-[#121212] px-4 py-3 text-sm leading-relaxed text-white placeholder:text-[#666666] focus:border-[#1DB954] focus:outline-none resize-y"
        />
      </div>

      {/* Interactive clickable token highlight surface */}
      {text.trim().length > 0 && (
        <div className="rounded-xl border border-[#262626] bg-[#121212] p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8E8E8E]">
            <span>Click a highlighted lemma to set the exact target span</span>
            {selectedSpan && (
              <span className="font-mono-tabular text-[#1DB954]">
                Selected: {selectedSpan.surface} [{selectedSpan.start}–
                {selectedSpan.end}] ·{' '}
                {neuralSet.has(selectedSpan.word)
                  ? 'XLM-R LoRA + Rules'
                  : 'Rules / Dictionary'}
              </span>
            )}
          </div>
          <div className="text-sm leading-8 text-[#E5E5E5] break-words">
            {segments.map((seg, i) => {
              if (seg.spanIndex === null || !seg.match) {
                return <span key={i}>{seg.text}</span>;
              }
              const isSelected = seg.spanIndex === safeIndex;
              return (
                <button
                  key={`${seg.match.start}-${seg.match.end}`}
                  type="button"
                  onClick={() => onSelectSpanIndex(seg.spanIndex!)}
                  aria-pressed={isSelected}
                  aria-label={`Select target ${seg.match.surface} characters ${seg.match.start} to ${seg.match.end}`}
                  className={`mx-0.5 inline-flex items-baseline gap-1 rounded-md px-2 py-0.5 font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1DB954] ${
                    isSelected
                      ? 'bg-[#1DB954] text-black font-bold'
                      : 'bg-[#262626] text-white hover:bg-[#333333] border border-[#3A3A3A]'
                  }`}
                >
                  <span>{seg.text}</span>
                  <span
                    className={`font-mono-tabular text-[10px] ${
                      isSelected ? 'text-black/75' : 'text-[#8E8E8E]'
                    }`}
                  >
                    {seg.match.start}–{seg.match.end}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Synchronized occurrence dropdown (matches Streamlit target_form) */}
      <div>
        <label
          htmlFor={`${idPrefix}-occurrence`}
          className="block text-xs font-semibold text-[#D4D4D4] mb-2"
        >
          Target occurrence
        </label>
        {spans.length > 0 ? (
          <select
            id={`${idPrefix}-occurrence`}
            value={safeIndex}
            onChange={(e) => onSelectSpanIndex(Number(e.target.value))}
            className="w-full rounded-xl border border-[#323232] bg-[#121212] px-4 py-2.5 text-sm text-white focus:border-[#1DB954] focus:outline-none"
          >
            {spans.map((span, idx) => (
              <option
                key={`${span.start}-${span.end}`}
                value={idx}
                className="bg-[#181818] text-white"
              >
                {span.surface} · characters {span.start}–{span.end} (
                {neuralSet.has(span.word)
                  ? 'Neural LoRA + Rules'
                  : 'Rules / Dictionary'}
                )
              </option>
            ))}
          </select>
        ) : (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            No supported inventory lemma detected in this sentence. Include one
            of the {Object.keys(inventory).length} curated ambiguous words (for
            example: bank, plant, right, table, interest, point, bat, crane).
          </div>
        )}
      </div>
    </div>
  );
}
