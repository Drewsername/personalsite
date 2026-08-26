import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const root = createRoot(document.getElementById('root'))
const render = (node) => root.render(<StrictMode>{node}</StrictMode>)

// The site is one scroll-jacked deck; /moveout is a separate plain page that
// shares nothing with it but the palette. Splitting them here rather than
// inside App keeps the WebGL swarm out of the moveout bundle entirely.
const isMoveout = /^\/moveout(\/|$)/.test(window.location.pathname)

if (isMoveout) {
  document.title = 'Moving out'
  // Unlisted: nothing links here and nothing should index it either. The
  // server's robots.txt says the same thing for crawlers that never run JS.
  const robots = document.createElement('meta')
  robots.name = 'robots'
  robots.content = 'noindex, nofollow'
  document.head.appendChild(robots)
  // index.html already swapped the palette before first paint; repeat it here
  // so the route still themes correctly if that script is ever moved or the
  // page is reached some other way.
  document.documentElement.classList.remove('dark')
  document.documentElement.classList.add('moveout')
  // The loader waits for the swarm's first frame, which is never coming here.
  document.getElementById('loader')?.remove()

  import('./moveout/MoveoutApp.jsx').then((mod) => {
    const MoveoutApp = mod.MoveoutApp
    render(<MoveoutApp />)
  })
} else {
  import('./App.jsx').then((mod) => {
    const App = mod.default
    render(<App />)
  })
}
