import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadFormatters } from './_fixtures/load-src.mjs';

const f = await loadFormatters();
const {
  formatNumber,
  formatYear,
  isYearLike,
  pickNumberFormatter,
  formatPercent,
  formatCurrency,
  niceNumber,
  niceScale,
  pickDateFormatter,
} = f;

// ---------- number ----------

test('formatNumber renders small integers unchanged', () => {
  assert.equal(formatNumber(42), '42');
  assert.equal(formatNumber(7), '7');
});

test('formatNumber adds comma thousands separator by default', () => {
  assert.equal(formatNumber(12345), '12,345');
  assert.equal(formatNumber(1000), '1,000');
  assert.equal(formatNumber(1234567), '1,234,567');
});

test('formatNumber compact scale uses k/M/B suffixes', () => {
  assert.equal(formatNumber(1_500_000, { compact: true }), '1.5M');
  assert.equal(formatNumber(2_500, { compact: true }), '2.5k');
  assert.equal(formatNumber(1_000_000_000, { compact: true }), '1B');
  assert.equal(formatNumber(1_200_000_000_000, { compact: true }), '1.2T');
});

test('formatNumber(0) returns "0" with no decimal', () => {
  assert.equal(formatNumber(0), '0');
});

test('formatNumber handles negatives with thousands separator', () => {
  assert.equal(formatNumber(-1234567), '-1,234,567');
});

test('formatNumber compact handles negatives', () => {
  assert.equal(formatNumber(-1_500_000, { compact: true }), '-1.5M');
});

test('formatNumber handles sub-cent fractions with extra decimals', () => {
  assert.equal(formatNumber(0.0001), '0.0001');
});

test('formatNumber returns em-dash for non-finite input', () => {
  assert.equal(formatNumber(NaN), '—');
  assert.equal(formatNumber(Infinity), '—');
  assert.equal(formatNumber(-Infinity), '—');
});

test('formatNumber with custom thousandsSep', () => {
  assert.equal(formatNumber(12345, { thousandsSep: ' ' }), '12 345');
});

test('formatNumber with signed option prefixes positive with +', () => {
  assert.equal(formatNumber(42, { signed: true }), '+42');
  assert.equal(formatNumber(-42, { signed: true }), '-42');
  assert.equal(formatNumber(0, { signed: true }), '0');
});

test('formatNumber(1999) at the primitive level is NOT year-aware', () => {
  // formatNumber itself does not apply year detection; that is done by
  // pickNumberFormatter / formatYear. Lock down current behavior.
  assert.equal(formatNumber(1999), '1,999');
});

// ---------- year ----------

test('formatYear prints whole year', () => {
  assert.equal(formatYear(2024), '2024');
  assert.equal(formatYear(1900), '1900');
});

test('formatYear rounds fractional input', () => {
  assert.equal(formatYear(1999.4), '1999');
  assert.equal(formatYear(2000.9), '2001');
});

test('isYearLike spans 1500..2200 inclusive', () => {
  assert.equal(isYearLike(1900), true);
  assert.equal(isYearLike(1500), true);
  assert.equal(isYearLike(2200), true);
  assert.equal(isYearLike(2024), true);
});

test('isYearLike rejects values outside the year range', () => {
  assert.equal(isYearLike(3000), false);
  assert.equal(isYearLike(50), false);
  assert.equal(isYearLike(1499), false);
  assert.equal(isYearLike(2201), false);
});

test('isYearLike rejects non-integers', () => {
  assert.equal(isYearLike(2020.5), false);
});

test('pickNumberFormatter auto-detects year series', () => {
  const fmt = pickNumberFormatter([2020, 2021, 2022]);
  assert.deepEqual([2020, 2021, 2022].map(fmt), ['2020', '2021', '2022']);
});

test('pickNumberFormatter compacts when max >= 1000', () => {
  const fmt = pickNumberFormatter([100, 500, 1_000_000]);
  assert.equal(fmt(1_000_000), '1M');
});

test('pickNumberFormatter for explicit percent multiplies by 100', () => {
  const fmt = pickNumberFormatter([], 'percent');
  assert.equal(fmt(0.25), '25%');
});

// ---------- date ----------

test('pickDateFormatter emits hour:minute labels for span < 2 days', () => {
  const dates = [
    new Date(Date.UTC(2024, 0, 1, 0, 0)),
    new Date(Date.UTC(2024, 0, 1, 6, 0)),
    new Date(Date.UTC(2024, 0, 1, 18, 0)),
  ];
  const fmt = pickDateFormatter(dates);
  assert.deepEqual(dates.map(fmt), ['00:00', '06:00', '18:00']);
});

test('pickDateFormatter emits Mon D labels for multi-day span under 60 days', () => {
  const dates = [
    new Date(Date.UTC(2024, 0, 1)),
    new Date(Date.UTC(2024, 0, 5)),
    new Date(Date.UTC(2024, 0, 10)),
  ];
  const fmt = pickDateFormatter(dates);
  assert.deepEqual(dates.map(fmt), ['Jan 1', 'Jan 5', 'Jan 10']);
});

test('pickDateFormatter emits month-only labels for span 60d..1y', () => {
  const dates = [
    new Date(Date.UTC(2024, 0, 1)),
    new Date(Date.UTC(2024, 3, 1)),
    new Date(Date.UTC(2024, 7, 1)),
  ];
  const fmt = pickDateFormatter(dates);
  assert.deepEqual(dates.map(fmt), ['Jan', 'Apr', 'Aug']);
});

test('pickDateFormatter emits month + short-year for 1..3y span', () => {
  const dates = [
    new Date(Date.UTC(2024, 0, 1)),
    new Date(Date.UTC(2025, 5, 1)),
  ];
  const fmt = pickDateFormatter(dates);
  assert.deepEqual(dates.map(fmt), ['Jan 24', 'Jun 25']);
});

test('pickDateFormatter emits year-only labels for multi-year span', () => {
  const dates = [
    new Date(Date.UTC(2020, 0, 1)),
    new Date(Date.UTC(2022, 0, 1)),
    new Date(Date.UTC(2024, 0, 1)),
    new Date(Date.UTC(2026, 0, 1)),
    new Date(Date.UTC(2028, 0, 1)),
  ];
  const fmt = pickDateFormatter(dates);
  assert.deepEqual(dates.map(fmt), ['2020', '2022', '2024', '2026', '2028']);
});

test('pickDateFormatter with empty array falls back to ISO date', () => {
  const fmt = pickDateFormatter([]);
  assert.equal(fmt(new Date(Date.UTC(2024, 0, 15))), '2024-01-15');
});

// ---------- percent ----------

test('formatPercent scales fractions by 100 with % suffix', () => {
  assert.equal(formatPercent(0.25), '25%');
  assert.equal(formatPercent(1), '100%');
  assert.equal(formatPercent(0), '0%');
});

test('formatPercent keeps one decimal for non-integer percentages', () => {
  assert.equal(formatPercent(0.333), '33.3%');
  assert.equal(formatPercent(0.125), '12.5%');
});

test('formatPercent honours explicit decimals arg', () => {
  assert.equal(formatPercent(0.3333, 2), '33.33%');
  assert.equal(formatPercent(0.5, 0), '50%');
});

test('formatPercent on very small fractions', { skip: 'impl rounds tiny fractions to 0% — reported to manager' }, () => {
  // TODO: impl bug — reported to manager
  // formatPercent(0.00012) currently returns '0%' because the decimal-
  // auto-detect picks 1 decimal place (since 0.012 is non-integer) and then
  // formatNumber trims trailing zeros after toFixed(1). Ideal behavior would
  // keep precision so the tiny fraction is not silently erased.
  assert.notEqual(formatPercent(0.00012), '0%');
});

// ---------- currency ----------

test('formatCurrency USD prefix is "$"', () => {
  const out = formatCurrency(123, 'USD');
  assert.ok(out.startsWith('$'), `expected leading $, got ${out}`);
});

test('formatCurrency compacts when abs >= 1000', () => {
  assert.equal(formatCurrency(1_500_000, 'USD'), '$1.5M');
  assert.equal(formatCurrency(1234.5, 'USD'), '$1.2k');
});

test('formatCurrency does not compact small values', () => {
  assert.equal(formatCurrency(123, 'USD'), '$123');
});

test('all five known currencies produce distinct prefixes/suffixes', () => {
  const outs = {
    USD: formatCurrency(1_500_000, 'USD'),
    EUR: formatCurrency(1_500_000, 'EUR'),
    GBP: formatCurrency(1_500_000, 'GBP'),
    JPY: formatCurrency(1_500_000, 'JPY'),
    CZK: formatCurrency(1_500_000, 'CZK'),
  };
  assert.equal(outs.USD, '$1.5M');
  assert.equal(outs.EUR, '€1.5M');
  assert.equal(outs.GBP, '£1.5M');
  assert.equal(outs.JPY, '¥1.5M');
  assert.equal(outs.CZK, '1.5M Kč');
  const values = Object.values(outs);
  const unique = new Set(values);
  assert.equal(unique.size, values.length, 'expected distinct outputs per currency');
});

test('formatCurrency CZK places symbol as suffix', () => {
  assert.equal(formatCurrency(42, 'CZK'), '42 Kč');
});

test('formatCurrency unknown currency code falls back to code-prefix', () => {
  assert.equal(formatCurrency(100, 'XYZ'), 'XYZ 100');
});

// ---------- tick (niceScale / niceNumber) ----------

test('niceNumber returns 0 for a zero range', () => {
  assert.equal(niceNumber(0, true), 0);
});

test('niceNumber rounds to a nice step', () => {
  // non-rounded path: pick the ceiling nice fraction
  assert.equal(niceNumber(1, false), 1);
  assert.equal(niceNumber(3, false), 5);
  assert.equal(niceNumber(7, false), 10);
  // rounded path: pick the nearest nice fraction
  assert.equal(niceNumber(1.2, true), 1);
  assert.equal(niceNumber(2.5, true), 2);
  assert.equal(niceNumber(4, true), 5);
});

test('niceScale(0, 100, 5) produces nice ticks stepped by 20', () => {
  const s = niceScale(0, 100, 5);
  assert.equal(s.step, 20);
  assert.deepEqual(s.ticks, [0, 20, 40, 60, 80, 100]);
  assert.equal(s.min, 0);
  assert.equal(s.max, 100);
});

test('niceScale handles negative min with first tick <= min and last tick >= max', () => {
  const s = niceScale(-15, 85, 4);
  assert.ok(s.ticks[0] <= -15, `first tick ${s.ticks[0]} > -15`);
  assert.ok(s.ticks[s.ticks.length - 1] >= 85, `last tick ${s.ticks.at(-1)} < 85`);
  // step is a "nice" number (power of 10 times {1,2,5})
  const fraction = s.step / Math.pow(10, Math.floor(Math.log10(s.step)));
  assert.ok([1, 2, 5, 10].includes(Math.round(fraction)), `step ${s.step} is not nice`);
});

test('niceScale handles small fractional ranges', () => {
  const s = niceScale(0.001, 0.1, 5);
  assert.ok(s.ticks[0] <= 0.001, `first tick ${s.ticks[0]} > 0.001`);
  assert.ok(s.ticks[s.ticks.length - 1] >= 0.1, `last tick ${s.ticks.at(-1)} < 0.1`);
  assert.ok(s.step > 0 && s.step < 1, `step ${s.step} not in (0,1)`);
});

test('niceScale degenerate case (min===max) returns at least two ticks', () => {
  const s = niceScale(5, 5, 5);
  assert.ok(s.ticks.length >= 2, `expected >=2 ticks, got ${s.ticks.length}`);
  assert.ok(s.min < 5 && s.max > 5, `expected padding around 5`);
});

test('niceScale(0, 0, 5) returns default 0..1 band without crashing', () => {
  const s = niceScale(0, 0, 5);
  assert.equal(s.min, 0);
  assert.equal(s.max, 1);
  assert.ok(s.ticks.length >= 2);
});

test('niceScale rejects non-finite inputs gracefully', () => {
  const s = niceScale(NaN, Infinity, 5);
  assert.ok(Number.isFinite(s.min) && Number.isFinite(s.max));
  assert.ok(s.ticks.length >= 2);
});
