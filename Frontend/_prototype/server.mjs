// HighPeak demo frontend server.
//
// A throwaway, zero-dependency dev server (Node built-ins only) that:
//   1. Serves index.html (the single-file React demo)
//   2. Proxies every /api/* request to the Spring Boot backend
//
// Because the browser only ever talks to THIS server (same origin), the
// backend's missing CORS config is a non-issue — the proxy makes the call
// server-to-server. Run with:  node server.mjs   then open http://localhost:5173
//
// This whole folder is meant to be deleted and replaced by the real
// React + Vite stack described in ../FRONTEND.md once the project scales.

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT) || 5173;
// Where the Spring Boot backend lives (context path /api/v1 included in requests).
const BACKEND = new URL(process.env.BACKEND_URL || 'http://localhost:8080');

const server = http.createServer(async (req, res) => {
  // --- Proxy API calls to the backend -------------------------------------
  if (req.url.startsWith('/api')) {
    const proxyReq = http.request(
      {
        hostname: BACKEND.hostname,
        port: BACKEND.port || 80,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: BACKEND.host },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );
    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 502,
          error: 'Bad Gateway',
          message: `Cannot reach backend at ${BACKEND.origin}. Is it running? (${err.code})`,
        })
      );
    });
    req.pipe(proxyReq);
    return;
  }

  // --- Otherwise serve the single-page app --------------------------------
  try {
    const html = await readFile(join(__dirname, 'index.html'));
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch {
    res.writeHead(500);
    res.end('index.html not found');
  }
});

server.listen(PORT, () => {
  console.log(`\n  HighPeak demo  →  http://localhost:${PORT}`);
  console.log(`  Proxying /api  →  ${BACKEND.origin}\n`);
});
