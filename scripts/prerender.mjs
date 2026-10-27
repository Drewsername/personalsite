import { createServer } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Reuse the actual homepage components so the first response never has stale copy.
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const { HeroPanel } = await vite.ssrLoadModule('/src/site/Hero.jsx');
  const { Nav } = await vite.ssrLoadModule('/src/site/Nav.jsx');
  const html = renderToStaticMarkup(React.createElement(React.Fragment, null,
    React.createElement(Nav, { active: 'top' }),
    React.createElement('div', { className: 'instant-title', 'aria-hidden': true }, 'Drew Bermudez'),
    React.createElement('main', { className: 'instant-home' }, React.createElement(HeroPanel))));
  const file = new URL('../dist/index.html', import.meta.url);
  const template = await readFile(file, 'utf8');
  await writeFile(file, template.replace('<div id="root"></div>', `<div id="root">${html}</div>`));
} finally {
  await vite.close();
}
