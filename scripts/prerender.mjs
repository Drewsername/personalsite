import { createServer } from 'vite';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Reuse the actual homepage components so the first response never has stale copy.
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const { default: App } = await vite.ssrLoadModule('/src/App.jsx');
  const html = renderToStaticMarkup(React.createElement(App));
  const file = new URL('../dist/index.html', import.meta.url);
  const template = await readFile(file, 'utf8');
  await writeFile(file, template.replace('<div id="root"></div>', `<div id="root">${html}</div>`));

  const { Booking } = await vite.ssrLoadModule('/src/booking/Booking.jsx');
  const booking = template
    .replace('class="light"', 'class="light booking"')
    .replace('<title>Drew Bermudez</title>', '<title>Book 30 minutes · Drew Bermudez</title>')
    .replace('<div id="root"></div>', `<div id="root">${renderToStaticMarkup(React.createElement(Booking))}</div>`)
    .replace(/<script type="module"[^>]*><\/script>/g, '')
    .replace(/<link rel="modulepreload"[^>]*>/g, '');
  await mkdir(new URL('../dist/cal/', import.meta.url), { recursive: true });
  await writeFile(new URL('../dist/cal/30min.html', import.meta.url), booking);
} finally {
  await vite.close();
}
