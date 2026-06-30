// Single source of truth for all site copy. Edit here.

export const content = {
  name: 'Drew Bermudez',
  tagline: 'creative technologist',

  nav: [
    { id: 'projects', label: 'Projects' },
    { id: 'advisory', label: 'Advisory' },
    { id: 'opinions', label: 'Opinions' },
    { id: 'contact', label: 'Contact' },
  ],

  // Home landing cards (2×2 grid). Each routes to its section panel.
  cards: [
    { id: 'projects', label: 'Projects' },
    { id: 'advisory', label: 'Advisory / Consulting' },
    { id: 'opinions', label: 'Opinions' },
    { id: 'contact', label: 'Contact' },
  ],

  // Section panels. `word` is the giant swarm word behind the panel; the body is
  // intentionally empty for now — each section is under construction.
  sections: {
    projects: { word: 'Projects', label: 'Projects', heading: 'Projects' },
    advisory: { word: 'Advisory', label: 'Advisory', heading: 'Advisory / Consulting' },
    opinions: { word: 'Opinions', label: 'Opinions', heading: 'Opinions' },
    contact: { word: 'Contact', label: 'Contact', heading: 'Contact' },
  },

  // Nav CTA. Login is a placeholder for now — no auth flow wired up yet.
  cta: { label: 'Login', href: '#' },

  accent: '#35E0FF',
};
