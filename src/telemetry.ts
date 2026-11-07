// Dev-only playtest log: events go to the Vite dev server (see vite.config.ts) and land in playtest/log.jsonl.
const ENDPOINT = '/__playlog';
const FLUSH_MS = 2000;

let buffer: string[] = [];

function flush(): void {
  if (buffer.length === 0) return;
  const body = buffer.join('\n');
  buffer = [];
  if (!navigator.sendBeacon(ENDPOINT, body)) {
    void fetch(ENDPOINT, { method: 'POST', body, keepalive: true }).catch(() => undefined);
  }
}

if (import.meta.env.DEV) {
  setInterval(flush, FLUSH_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flush();
  });
}

export function track(event: string, data: Record<string, unknown>): void {
  if (!import.meta.env.DEV) return;
  buffer.push(JSON.stringify({ event, wall: Date.now(), ...data }));
  if (event === 'run_end') flush();
}
