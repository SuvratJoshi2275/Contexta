import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildHighlightedSegments,
  detectInventorySpans,
  formatPercent,
  getInventoryStats,
  isValidHealthResponse,
  normalizeBaseUrl,
  parseCsvText,
  serializeCsv,
} from './nlp';
import type { InventoryMap } from '../types/contexta';

const inventoryPath = path.resolve(
  process.cwd(),
  'frontend/src/data/artifacts/inventory.json',
);
const realInventory = JSON.parse(
  fs.readFileSync(inventoryPath, 'utf8'),
) as InventoryMap;

const hybridConfigPath = path.resolve(
  process.cwd(),
  'frontend/src/data/artifacts/hybrid_config.json',
);
const hybridConfig = JSON.parse(
  fs.readFileSync(hybridConfigPath, 'utf8'),
) as { supported_words: string[] };

test('getInventoryStats derives 35 words dynamically from real inventory.json', () => {
  const stats = getInventoryStats(realInventory, hybridConfig.supported_words);
  assert.equal(stats.totalWords, 35);
  assert.equal(stats.neuralCount, 6);
  assert.equal(stats.ruleOnlyCount, 29);
  assert.equal(stats.totalSenses, 70);
});

test('detectInventorySpans finds multiple occurrences with exact character offsets', () => {
  const sentence = 'The bank near the river bank approved the loan.';
  const spans = detectInventorySpans(sentence, realInventory);
  assert.equal(spans.length, 2);
  assert.deepEqual(spans[0], { word: 'bank', surface: 'bank', start: 4, end: 8 });
  assert.deepEqual(spans[1], { word: 'bank', surface: 'bank', start: 24, end: 28 });
  assert.equal(sentence.slice(spans[0].start, spans[0].end), 'bank');
  assert.equal(sentence.slice(spans[1].start, spans[1].end), 'bank');
});

test('detectInventorySpans handles Devanagari code-mixed sentences without corrupting offsets', () => {
  const sentence = 'Mujhe bank जाना है।';
  const spans = detectInventorySpans(sentence, realInventory);
  assert.equal(spans.length, 1);
  assert.deepEqual(spans[0], { word: 'bank', surface: 'bank', start: 6, end: 10 });
});

test('buildHighlightedSegments reconstructs the exact original sentence', () => {
  const sentence = 'Turn right to reach the right plant on the table.';
  const spans = detectInventorySpans(sentence, realInventory);
  const segments = buildHighlightedSegments(sentence, spans);
  assert.equal(segments.map((s) => s.text).join(''), sentence);
  assert.equal(segments.filter((s) => s.spanIndex !== null).length, spans.length);
});

test('isValidHealthResponse accepts valid FastAPI payload and rejects error payloads', () => {
  assert.equal(
    isValidHealthResponse({
      status: 'ok',
      inventory_words: 35,
      neural_checkpoint: true,
      lid_checkpoint: true,
      translation_checkpoint: false,
      models: { wsd_lora: true, lid: true, translation: false },
    }),
    true,
  );
  assert.equal(
    isValidHealthResponse({ detail: 'Unauthorized', backend_offline: true }),
    false,
  );
  assert.equal(isValidHealthResponse(null), false);
});

test('parseCsvText validates text column, handles quoted commas, and enforces row limits', () => {
  const valid = parseCsvText(
    '\uFEFFtext,word\n"The bank, near the river, flooded.",bank\n"Turn right here.",right',
    250,
  );
  assert.equal(valid.error, undefined);
  assert.equal(valid.rows.length, 2);
  assert.equal(valid.rows[0].text, 'The bank, near the river, flooded.');
  assert.equal(valid.rows[1].word, 'right');

  const missingCol = parseCsvText('sentence,word\n"Hello",bank');
  assert.match(missingCol.error ?? '', /requires a "text" column/i);

  const tooMany = parseCsvText('text\na\nb\nc', 2);
  assert.match(tooMany.error ?? '', /exceeding the 2-row limit/i);
});

test('serializeCsv escapes quotes and preserves columns', () => {
  const csv = serializeCsv(
    [{ text: 'He said "bank"', hindi: 'बैंक' }],
    ['text', 'hindi'],
  );
  assert.equal(csv, '"text","hindi"\n"He said ""bank""","बैंक"');
});

test('formatPercent and normalizeBaseUrl format safely', () => {
  assert.equal(formatPercent(0.98387, 2), '98.39%');
  assert.equal(formatPercent(null), '—');
  assert.equal(normalizeBaseUrl(' http://127.0.0.1:8000/// '), 'http://127.0.0.1:8000');
});
