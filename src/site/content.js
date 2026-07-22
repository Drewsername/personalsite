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

  // Projects reel. `name` is also the swarm word when the project is open.
  // `tint` colours the placeholder texture standing in for each screen recording.
  // Foundry / Chorus are working titles.
  projects: [
    {
      name: 'Arbr',
      line: 'vibe-coding for frontend development',
      tint: 'rgba(53,224,255,0.07)',
      video: '/media/arbr.mp4',
      body: 'One of the earliest vibe-coding platforms in 2023 focused on frontend software development, Arbr was a direct competitor to gpt-engineer, which became Lovable. Built on GPT3.5 before agents and orchestration were common concepts, we introduced many forward-looking innovations including wrapping Reinforcement Learning (RL) to improve model performance, and a harness to introduce planning for the agent.',
    },
    {
      name: 'Foundry',
      line: 'an agent-run company builder',
      tint: 'rgba(138,162,255,0.07)',
      video: '/media/foundry.mp4',
      body: 'Inspired by Polsia, a company-building platform built as an agent-orchestration experiment. It scaled dockerized company instances on Railway — full-stack development and deployment — with every company auto-deployed to its own subdomain. A management agent ran market research through Exa, maintained a knowledgebase the other agents could query, and managed a kanban board, assigning work across the team. The same design later became popular on its own: agents around a shared board are now everywhere.',
    },
    {
      name: 'PSI',
      line: 'audience simulation with SLM swarms',
      tint: 'rgba(232,184,255,0.07)',
      video: '/media/chorus.mp4',
      body: 'An audience-simulation platform, and the project closest to my ongoing interests. A large-model agent browses the web and pitches to a swarm of 8B small-model agents that read and interact with the simulated product. The question: can a cheap synthetic audience help a big agent iterate better? It can — performance improved, though I stopped short of benchmarking compute cost. Persona simulation and agent swarms — cheaper A/B testing, product taste in agentic development, demand planning for new products — are where I’m spending my attention now; most of the field’s focus is still on agent evals.',
    },
  ],

  // Nav CTA. Login is a placeholder for now — no auth flow wired up yet.
  cta: { label: 'Login', href: '#' },

  accent: '#35E0FF',
};
