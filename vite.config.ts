import { appendFileSync, mkdirSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

const playtestLog = (): Plugin => ({
  name: 'playtest-log',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/__playlog', (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end();
        return;
      }
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        mkdirSync('playtest', { recursive: true });
        appendFileSync('playtest/log.jsonl', body.trim() + '\n');
        res.statusCode = 204;
        res.end();
      });
    });
  },
});

export default defineConfig({
  base: './',
  plugins: [playtestLog()],
  build: { assetsInlineLimit: 0, chunkSizeWarningLimit: 2000 },
});
