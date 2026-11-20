import React, { useMemo, useState } from 'react';
import { ArrowUpRight, BookOpen, Search } from 'lucide-react';
import type { InventoryMap, ModuleId } from '../types/contexta';
import { NEURAL_SUPPORTED_WORDS } from '../data/researchArtifacts';
import { getInventoryStats } from '../utils/nlp';
import { ModuleHero, ProvenanceBar } from '../components/Layout';

interface SenseExplorerViewProps {
  inventory: InventoryMap;
  inventorySource: 'live' | 'bundled';
  onTestLemmaInWsd: (lemma: string, sampleSentence: string) => void;
  onNavigate: (id: ModuleId) => void;
}

type ScopeFilter = 'all' | 'neural' | 'rule';

export function SenseExplorerView({
  inventory,
  inventorySource,
  onTestLemmaInWsd,
}: SenseExplorerViewProps) {
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [selectedWord, setSelectedWord] = useState<string>(
    () => Object.keys(inventory)[0] || 'bank',
  );

  const neuralSet = useMemo(
    () => new Set(NEURAL_SUPPORTED_WORDS.map((w) => w.toLowerCase())),
    [],
  );

  const stats = useMemo(
    () => getInventoryStats(inventory, NEURAL_SUPPORTED_WORDS),
    [inventory],
  );

  const filteredWords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return Object.keys(inventory)
      .sort((a, b) => a.localeCompare(b))
      .filter((word) => {
        if (scope === 'neural' && !neuralSet.has(word)) return false;
        if (scope === 'rule' && neuralSet.has(word)) return false;
        if (!q) return true;
        const entry = inventory[word];
        const haystack = `${word} ${entry.senses
          .map((s) => `${s.id} ${s.hindi} ${s.definition} ${s.cues.join(' ')}`)
          .join(' ')}`.toLowerCase();
        return haystack.includes(q);
      });
  }, [inventory, search, scope, neuralSet]);

  const activeWord = filteredWords.includes(selectedWord)
    ? selectedWord
    : filteredWords[0] || null;
  const activeEntry = activeWord ? inventory[activeWord] : null;

  return (
    <div className="pb-16">
      <ModuleHero
        kicker="Lexical Resource · configs/inventory.json"
        title="Sense Inventory Explorer"
        subtitle="Inspect every curated ambiguous English lemma, its Devanagari Hindi translations, competing definitions, and deterministic lexical cue sets."
        metaItems={[
          `${stats.totalWords} ambiguous lemmas`,
          `${stats.totalSenses} curated senses`,
          `${stats.neuralCount} XLM-R LoRA + Rules`,
          `${stats.ruleOnlyCount} Rules / Dictionary`,
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pt-8 space-y-6 sm:px-6 lg:px-10">
        <ProvenanceBar
          sourceType={inventorySource === 'live' ? 'live' : 'bundled'}
          sourcePath={
            inventorySource === 'live'
              ? 'GET /api/inventory'
              : 'configs/inventory.json'
          }
          note={`Dynamically loaded · ${stats.totalWords} lemmas`}
        />

        {/* Search + Segmented Filter Bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8E8E]"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search lemmas, Hindi meanings, definitions, or cues"
              placeholder="Search lemmas, Hindi glosses, definitions, or cues…"
              className="h-11 w-full rounded-full border border-[#323232] bg-[#181818] pl-10 pr-4 text-sm text-white placeholder:text-[#7A7A7A] focus:border-[#1DB954] focus:outline-none"
            />
          </div>

          <div
            role="tablist"
            aria-label="Filter inventory by model coverage"
            className="inline-flex items-center gap-1 rounded-full border border-[#2A2A2A] bg-[#181818] p-1"
          >
            {[
              { id: 'all' as const, label: `All (${stats.totalWords})` },
              {
                id: 'neural' as const,
                label: `Neural + Rules (${stats.neuralCount})`,
              },
              {
                id: 'rule' as const,
                label: `Rules Only (${stats.ruleOnlyCount})`,
              },
            ].map((tab) => {
              const active = scope === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setScope(tab.id)}
                  className={`h-9 rounded-full px-4 text-xs font-semibold transition-colors whitespace-nowrap ${
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
        </div>

        {/* Master-detail split */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Lemma index */}
          <div className="lg:col-span-4 rounded-xl border border-[#282828] bg-[#181818] overflow-hidden">
            <div className="border-b border-[#242424] px-4 py-3 flex items-center justify-between text-xs text-[#8E8E8E]">
              <span>Lemmas</span>
              <span className="font-mono-tabular">
                {filteredWords.length} / {stats.totalWords}
              </span>
            </div>
            {filteredWords.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8E8E8E]">
                No lemmas match “{search}”.
              </div>
            ) : (
              <ul className="max-h-[540px] divide-y divide-[#222222] overflow-y-auto">
                {filteredWords.map((word) => {
                  const isSelected = word === activeWord;
                  const isNeural = neuralSet.has(word);
                  const senses = inventory[word]?.senses ?? [];
                  return (
                    <li key={word}>
                      <button
                        type="button"
                        onClick={() => setSelectedWord(word)}
                        aria-current={isSelected ? 'true' : undefined}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                          isSelected
                            ? 'bg-[#282828] text-white'
                            : 'text-[#D4D4D4] hover:bg-[#202020]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-semibold capitalize ${
                                isSelected ? 'text-[#1DB954]' : 'text-white'
                              }`}
                            >
                              {word}
                            </span>
                            <span className="truncate text-xs text-[#8E8E8E]">
                              {senses.map((s) => s.hindi).join(' / ')}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#8E8E8E]">
                            {isNeural ? 'XLM-R LoRA + Rules' : 'Rules / Dictionary'}
                          </div>
                        </div>
                        <span className="font-mono-tabular text-[11px] text-[#8E8E8E] shrink-0">
                          {senses.length} senses
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Selected lemma sense detail */}
          <div className="lg:col-span-8">
            {activeEntry && activeWord ? (
              <div className="rounded-xl border border-[#282828] bg-[#181818] p-6 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#242424] pb-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
                      <span
                        className={`font-semibold ${
                          neuralSet.has(activeWord)
                            ? 'text-[#1DB954]'
                            : 'text-[#D4D4D4]'
                        }`}
                      >
                        {neuralSet.has(activeWord)
                          ? 'XLM-R LoRA + Rules'
                          : 'Rules / Dictionary'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>POS: {activeEntry.pos}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">
                        Default: {activeEntry.default}
                      </span>
                    </div>
                    <h2 className="font-display text-3xl font-extrabold capitalize text-white">
                      {activeEntry.lemma}
                    </h2>
                    <p className="text-xs text-[#8E8E8E]">
                      Provenance: {activeEntry.provenance}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const firstCue = activeEntry.senses[0]?.cues[0] ?? '';
                      const sample = firstCue
                        ? `The ${activeWord} was closely linked to ${firstCue}.`
                        : `Inspect the meaning of ${activeWord} in context.`;
                      onTestLemmaInWsd(activeWord, sample);
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1DB954] px-5 text-xs font-bold text-black hover:bg-[#1ED760] transition-colors whitespace-nowrap"
                  >
                    <span>Test in WSD Lab</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {activeEntry.senses.map((sense) => {
                    const isDefault = sense.id === activeEntry.default;
                    return (
                      <div
                        key={sense.id}
                        className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-5 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-mono-tabular font-semibold text-[#1DB954]">
                            {sense.id}
                          </span>
                          <span className="text-[#8E8E8E]">
                            {isDefault ? 'Default sense' : 'Secondary sense'}
                          </span>
                        </div>
                        <div className="font-display text-3xl font-bold text-white">
                          {sense.hindi}
                        </div>
                        <p className="text-sm text-[#CCCCCC]">
                          {sense.definition}
                        </p>
                        <div className="border-t border-[#222222] pt-3 space-y-1.5">
                          <div className="text-[11px] font-medium text-[#8E8E8E]">
                            Lexical evidence cues ({sense.cues.length})
                          </div>
                          <div className="font-mono-tabular text-xs leading-relaxed text-[#E5E5E5]">
                            {sense.cues.join(' · ')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#303030] bg-[#181818] p-12 text-center space-y-2">
                <BookOpen className="mx-auto h-5 w-5 text-[#8E8E8E]" />
                <p className="text-xs text-[#A3A3A3]">
                  Select a lemma from the list to inspect its curated Hindi senses
                  and lexical cues.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
