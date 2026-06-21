#!/usr/bin/env node
/**
 * legacy-server.mjs — static server with vercel.json rewrite support.
 * Replaces `npx serve` for baseline capture so URL-routed surfaces
 * (schools, dashboard, onboard) are served correctly.
 *
 * Usage: node legacy-server.mjs [port]   (default 3001)
 */
import http from 'http';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '../../..');
const PORT      = parseInt(process.argv[2] || process.env.LEGACY_PORT || '3001', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.jsx':  'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.txt':  'text/plain',
};

// Mirror vercel.json rewrites + redirects.
// Returns a repo-relative file path to serve, or null to serve the requested path as-is.
// Static asset paths (those with a file extension) are NEVER rewritten — they serve as files.
const STATIC = /\.(js|jsx|css|png|jpg|jpeg|svg|ico|json|woff|woff2|ttf|txt|map|html)$/;

function rewrite(pathname) {
  if (STATIC.test(pathname)) return null; // always serve static assets directly

  if (pathname.startsWith('/schools/'))                              return 'schools/index.html';
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return 'dashboard/index.html';
  if (pathname === '/onboarding')                                    return 'onboard.html';
  if (pathname === '/home')                                          return 'www/index.html';
  if (pathname === '/privacy' || pathname === '/privacy-policy')     return 'legal/privacy-policy.html';
  if (pathname === '/terms'   || pathname === '/terms-of-service')   return 'legal/terms.html';
  // Operator SPA catch-all (mirrors last vercel.json rewrite)
  return 'index.html';
}

const server = http.createServer((req, res) => {
  const url      = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const target   = rewrite(pathname);
  const filePath = path.join(ROOT, target ?? pathname.replace(/^\//, ''));
  const ext      = path.extname(filePath).toLowerCase();

  try {
    let content = fs.readFileSync(filePath);
    const contentType = MIME[ext] ?? 'application/octet-stream';

    // When serving a rewrite (HTML at a different URL path), inject <base href="/"> so
    // relative script/link URLs in the HTML resolve to the repo root, not the URL path.
    if (target && ext === '.html') {
      const html = content.toString('utf8').replace(
        /(<head[^>]*>)/i,
        '$1<base href="/">',
      );
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(html);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`404: ${pathname}`);
  }
});

server.listen(PORT, () => process.stdout.write(`legacy-server ready on http://localhost:${PORT}\n`));

process.on('SIGTERM', () => { server.close(); process.exit(0); });
process.on('SIGINT',  () => { server.close(); process.exit(0); });
