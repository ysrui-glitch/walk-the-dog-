// Synthesised sound effects: no audio files to load, which keeps the GamePix bundle small.
let ctx: AudioContext | undefined;

function audio(): AudioContext | undefined {
  try {
    ctx ??= new AudioContext();
  } catch {
    return undefined;
  }
  if (ctx.state === 'suspended' && !document.hidden) void ctx.resume();
  return ctx;
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) void ctx?.suspend();
  else void ctx?.resume();
});

function tone(freq: number, ms: number, type: OscillatorType = 'sine', volume = 0.15, slideTo?: number, delayMs = 0): void {
  const a = audio();
  if (!a) return;
  const start = a.currentTime + delayMs / 1000;
  const end = start + ms / 1000;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, end);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, end);
  osc.connect(gain).connect(a.destination);
  osc.start(start);
  osc.stop(end);
}

function noise(ms: number, volume = 0.2): void {
  const a = audio();
  if (!a) return;
  const buffer = a.createBuffer(1, Math.floor((a.sampleRate * ms) / 1000), a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const source = a.createBufferSource();
  const gain = a.createGain();
  gain.gain.value = volume;
  source.buffer = buffer;
  source.connect(gain).connect(a.destination);
  source.start();
}

const semitone = (base: number, steps: number) => base * 2 ** (steps / 12);

export const sfx = {
  pickup(combo: number): void {
    tone(semitone(523, Math.min(combo, 24)), 120, 'triangle', 0.18);
  },
  hurt(): void {
    tone(220, 300, 'square', 0.12, 70);
  },
  splash(): void {
    noise(180, 0.12);
    tone(500, 140, 'sine', 0.06, 180);
  },
  // A ride running out: a soft two-note "bwoop" down, like a toy winding down.
  rideEnd(): void {
    tone(520, 110, 'sine', 0.07);
    tone(390, 200, 'sine', 0.06, 260, 100);
  },
  // A ride breaking under you: a dull thud and a cartoon boing, not a crash.
  rideCrash(): void {
    tone(150, 120, 'triangle', 0.12, 90);
    tone(700, 260, 'sine', 0.05, 300, 60);
  },
  // A balloon bursting: a sharp pop and a little squeak of escaping air.
  pop(): void {
    noise(70, 0.3);
    tone(900, 120, 'sine', 0.06, 1500, 30);
  },
  record(): void {
    [0, 4, 7, 12, 16].forEach((s, i) => tone(semitone(523, s), 160, 'square', 0.08, undefined, i * 90));
    noise(300, 0.1);
  },
  charged(): void {
    [0, 4, 7, 12].forEach((s, i) => tone(semitone(523, s), 120, 'triangle', 0.12, undefined, i * 70));
  },
  smash(combo: number): void {
    noise(140, 0.3);
    tone(semitone(330, Math.min(combo, 24)), 160, 'square', 0.1, undefined, 20);
  },
};
