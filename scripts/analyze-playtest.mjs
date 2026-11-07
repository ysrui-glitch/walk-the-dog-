#!/usr/bin/env node
// Summarise playtest/log.jsonl for the chase: per-run stats, what the player grabbed and threw, and why the dog got away.
import { readFileSync } from 'node:fs';

const file = process.argv[2] ?? 'playtest/log.jsonl';
const events = readFileSync(file, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line))
  .filter((e) => e.run !== undefined);

const runs = [...new Set(events.map((e) => e.run))].sort((a, b) => a - b);
const of = (run, name) => events.filter((e) => e.run === run && e.event === name);
const all = (name) => events.filter((e) => e.event === name);
const tally = (xs, by) => xs.reduce((acc, e) => ({ ...acc, [by(e)]: (acc[by(e)] ?? 0) + 1 }), {});
const median = (xs) => (xs.length === 0 ? '-' : [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]);

console.log(`Runs: ${runs.length}\n`);
console.log('run  secs  wall  score   meters  rides  best ride  throws  falls  close calls  pocket full  moves/min');
const ends = [];
for (const [i, run] of runs.entries()) {
  const start = of(run, 'run_start')[0];
  const end = of(run, 'run_end')[0];
  if (!end) continue;
  ends.push({ ...end, startWall: start?.wall });
  const secs = Math.round(end.t / 1000);
  const wall = start ? Math.round((end.wall - start.wall) / 1000) : '-';
  const rides = of(run, 'ride');
  const tiers = ['skate', 'balloon', 'scooter', 'cycle', 'moto', 'car'];
  const best = rides.map((r) => r.kind).sort((a, b) => tiers.indexOf(b) - tiers.indexOf(a))[0] ?? '-';
  const full = of(run, 'pocket').filter((p) => p.full).length;
  const row = [i + 1, secs, wall, end.score, end.meters, rides.length, best, of(run, 'toss').length, of(run, 'chase_hit').length, of(run, 'catch').length, full, Math.round((of(run, 'move').length / Math.max(1, end.t)) * 60000)];
  console.log(row.map((v, j) => String(v).padEnd([5, 6, 6, 8, 8, 7, 11, 8, 7, 13, 13, 9][j])).join(''));
}

console.log('\nWhat happened:');
console.log(`  rides grabbed: ${JSON.stringify(tally(all('ride'), (e) => e.kind))}`);
console.log(`  throws: ${JSON.stringify(tally(all('toss'), (e) => e.kind))}, median gap when throwing ${median(all('toss').map((e) => e.gap))}px`);
console.log(`  pickups into the pocket: ${all('pocket').filter((p) => !p.full).length}, wasted because the pocket was full: ${all('pocket').filter((p) => p.full).length}`);
console.log(`  items still in the pocket when the dog got away: ${ends.map((e) => e.pocketLeft ?? '-').join(', ')}`);
console.log(`  crashes: ${JSON.stringify(tally(all('chase_hit'), (e) => e.kind))}, of which on a ride (ride broke, no stun): ${all('chase_hit').filter((e) => e.ride).length}`);
console.log(`  poops picked up: ${all('poop').filter((e) => e.picked).length}/${all('poop').length}`);
console.log(`  cat chases: ${all('dog_event').filter((e) => e.glyph === '💨' || e.glyph === 'fx-dash').length}, cats treed: ${all('dog_event').filter((e) => e.glyph === '❗' || e.glyph === 'fx-alert').length}`);
console.log(`  dog events: ${JSON.stringify(tally(all('dog_event'), (e) => e.glyph))}`);
console.log(`  on a ride when the dog got away: ${ends.map((e) => e.onRide ?? 'on foot').join(', ')}`);

const ignored = all('gesture_ignored');
if (ignored.length) console.log(`  touch gestures that did nothing: ${ignored.length} (median |dx| ${median(ignored.map((e) => Math.abs(e.dx)))}, |dy| ${median(ignored.map((e) => Math.abs(e.dy)))})`);
console.log(`  runs on a touch screen: ${all('run_start').filter((e) => e.touch).length}/${all('run_start').length}`);
console.log(`  balloons tied on: ${all('shield').length}, crashes a balloon took for you: ${all('shield_pop').length}`);
const slips = all('slip');
if (slips.length) console.log(`  leash slipping at the end of the rope: ${slips.length}, saved: ${all('slip_saved').length}`);
for (const run of runs) {
  const ticks = of(run, 'tick');
  if (ticks.length < 6) continue;
  const last = ticks.slice(-8).map((e) => `${e.gap}${e.ride ? '' : '*'}`).join(' ');
  console.log(`  run ${runs.indexOf(run) + 1} gap, last 8s (* = on foot): ${last}`);
}
console.log('\nRetry (addiction proxy):');
const gaps = ends.slice(1).map((e, i) => (e.startWall && ends[i].wall ? Math.round((e.startWall - ends[i].wall) / 1000) : undefined)).filter((g) => g !== undefined);
console.log(`  seconds from game over to next run: ${gaps.join(', ')} (median ${median(gaps)})`);
console.log(`  scores in order: ${ends.map((e) => e.score).join(' → ')}`);
console.log(`  wall time ≈ game time for human runs; bot runs finish far faster than their game time`);
