// btc-cent-forecast-01 entry: volatility-conditioned mean reversion.
// Node 22, standard library only, offline, deterministic.
//
// Idea (from backtesting the six practice cases, 528 rolling 4h-ahead
// forecasts): at a 4-hour horizon Bitcoin's price mostly reverts toward
// its recent mean, but only a large move is a real signal — small wiggles
// are noise and extrapolating them loses. So this program stays at
// persistence (the price does not move) UNLESS the price has moved more
// than one 4-hour standard deviation away from its 4-hour moving average;
// then it pulls the forecast 30% of the way back toward that mean.
//
// Backtest (rolling, 528 points): MAE 43,173c vs persistence 43,822c
// (+1.47%). On the five exact practice checkpoints whose answers are
// recoverable from the overlapping case files, it never triggers and so
// exactly ties persistence (0.00%) — it cannot lose there by construction.
// The edge is small and regime-dependent; this is a cheap shot at a
// $250 pot with 0 entries, not a guaranteed win. Momentum was tested and
// rejected: extrapolating the last-4h return makes the MAE worse at every
// strength (k=0.05 already -1.14%).
//
// Entry format (program/v1): read every <id>.in in the input directory,
// write <id>.out: {"forecasts":[{"case":"<the case's id>","price":<number>}]},
// exactly one row, price finite, > 0, < 10,000,000, on the 5-decimal grid.
// Outside the grader: mkdir -p out && MAKEFUN_INPUT_DIR=input MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** The smallest positive price on the grid: one unit of its 5 decimals. */
const MIN_PRICE = 0.00001;
/** The largest grid price below the scorer's exclusive 10,000,000-dollar cap. */
const MAX_PRICE = 9_999_999.99999;

/** How far the price must sit from its 4h mean, in 4h sigmas, to count as a signal. */
const TRIGGER_SIGMAS = 1.0;
/** How much of the deviation the forecast pulls back when it triggers. */
const REVERT_FRACTION = 0.3;
/** The moving-average window, in minutes (4 hours). */
const MEAN_WINDOW = 240;

interface CaseMarket {
  id: string;
  prices: number[];
}

interface Case {
  markets: CaseMarket[];
}

/** x kept on the grid's 5 decimals and inside the scorer's (0, 10,000,000). */
const price5 = (x: number): number => Math.round(Math.min(MAX_PRICE, Math.max(MIN_PRICE, x)) * 1e5) / 1e5;

/** Mean of the last `window` closes ending at index t. */
function mean(prices: number[], t: number, window: number): number {
  let s = 0;
  for (let i = t - window + 1; i <= t; i += 1) s += prices[i];
  return s / window;
}

/** Per-minute sigma of 1-minute log returns over the last `window` minutes. */
function realizedVol(prices: number[], t: number, window: number): number {
  let s = 0;
  let s2 = 0;
  let n = 0;
  for (let i = t - window + 1; i <= t; i += 1) {
    const r = Math.log(prices[i] / prices[i - 1]);
    s += r;
    s2 += r * r;
    n += 1;
  }
  const m = s / n;
  return Math.sqrt(Math.max(0, s2 / n - m * m));
}

/**
 * Forecast the price 240 minutes after the checkpoint (index t).
 * Persistence unless the price is more than TRIGGER_SIGMAS 4h-sigmas from
 * its 4h mean, in which case pull REVERT_FRACTION of the way back.
 */
function forecast(m: CaseMarket): number {
  if (!Array.isArray(m.prices) || m.prices.length === 0) throw new Error(`market ${m.id} has no prices`);
  const prices = m.prices;
  const t = prices.length - 1;
  const last = prices[t] as number;
  if (typeof last !== 'number' || !Number.isFinite(last)) throw new Error(`market ${m.id}'s last price is not a finite number`);
  if (prices.length <= MEAN_WINDOW) return price5(last); // not enough history: persistence

  const dev = Math.log(last / mean(prices, t, MEAN_WINDOW));
  const vol4h = realizedVol(prices, t, MEAN_WINDOW) * Math.sqrt(MEAN_WINDOW);
  if (Math.abs(dev) < TRIGGER_SIGMAS * vol4h) return price5(last);
  return price5(last * Math.exp(-REVERT_FRACTION * dev));
}

mkdirSync(OUTPUT_DIR, { recursive: true });
// Every case file, in name order, so two runs write the same bytes.
const inputs = readdirSync(INPUT_DIR).filter((f) => f.endsWith('.in')).sort();
for (const file of inputs) {
  const id = file.slice(0, -'.in'.length);
  const c = JSON.parse(readFileSync(join(INPUT_DIR, file), 'utf8')) as Case;
  if (!Array.isArray(c.markets) || c.markets.length !== 1) throw new Error(`${file} does not hold exactly one market`);
  writeFileSync(join(OUTPUT_DIR, `${id}.out`), `${JSON.stringify({ forecasts: [{ case: id, price: forecast(c.markets[0] as CaseMarket) }] })}\n`);
}
