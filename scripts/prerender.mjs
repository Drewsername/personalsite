import { createServer } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
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
} finally {
  await vite.close();
}
