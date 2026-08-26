import { Admin } from './Admin.jsx';
import { PublicListing } from './Public.jsx';

// /moveout is a plain page, not a deck panel: no swarm, no WebGL, no
// scroll-jacking. It loads as its own bundle chunk so a visitor who only ever
// sees the listing never downloads the renderer.
//
// Routing is a single branch on the path. The two screens link to each other
// with ordinary anchors — a full navigation is fine for a page this small, and
// it keeps a real history stack for free.
export function MoveoutApp() {
  const admin = window.location.pathname.replace(/\/+$/, '') === '/moveout/admin';
  return admin ? <Admin /> : <PublicListing />;
}
