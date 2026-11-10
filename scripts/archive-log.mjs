// Moves playtest/log.jsonl out of the way before bots or screenshots write to it, keeping the player's runs apart from
// bot runs. Runs where wall time roughly equals game time were played by a person; bots step the game far faster.
// Usage: node scripts/archive-log.mjs <label>   e.g. v3.31
// Writes playtest/raw-<time>.jsonl (the untouched log), and session<N>-<label>.jsonl / bot-<label>-<time>.jsonl splits.
import { existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';

const label = process.argv[2];
if (!label) throw new Error('usage: node scripts/archive-log.mjs <label>');
const dir = 'playtest';
const log = `${dir}/log.jsonl`;
if (!existsSync(log)) {
  console.log('no log to archive');
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const raw = `${dir}/raw-${stamp}.jsonl`;
renameSync(log, raw);

const events = readFileSync(raw, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
const runs = Map.groupBy(events, (e) => e.run);
const human = new Set(
  [...runs].filter(([, ev]) => {
    const end = ev.find((e) => e.event === 'run_end') ?? ev.at(-1);
    const game = (end.t ?? 0) / 1000;
    const wall = (end.wall - ev[0].wall) / 1000;
    return game > 5 && wall / game > 0.7;
  }).map(([run]) => run),
);

const write = (path, rows) => rows.length && writeFileSync(path, rows.map((e) => JSON.stringify(e)).join('\n') + '\n');
const sessions = readdirSync(dir).map((f) => Number(/^session(\d+)/.exec(f)?.[1] ?? 0));
const session = `${dir}/session${Math.max(0, ...sessions) + 1}-${label}.jsonl`;
const people = events.filter((e) => human.has(e.run));
const bots = events.filter((e) => !human.has(e.run));
write(session, people);
write(`${dir}/bot-${label}-${stamp}.jsonl`, bots);
console.log(`raw kept as ${raw}; player runs: ${human.size}${people.length ? ` -> ${session}` : ''}; bot runs: ${runs.size - human.size}`);
