// Single source of truth for all site copy. Edit here.

export const content = {
  name: 'Drew Bermudez',

  nav: [
    { id: 'projects', label: 'Projects' },
    { id: 'contact', label: 'Contact' },
    { id: 'resume', label: 'Resume' },
  ],

  // Home landing cards (2×2 grid). Each routes to its section panel; an odd
  // count renders the last card full-width.
  cards: [
    { id: 'projects', label: 'Projects' },
    { id: 'contact', label: 'Contact' },
    { id: 'resume', label: 'Resume' },
  ],

  // Section panels. `word` is the giant swarm word behind the panel.
  sections: {
    projects: { word: 'Projects', label: 'Projects', heading: 'Projects' },
    contact: { word: 'Contact', label: 'Contact', heading: 'Contact' },
    resume: { word: 'Resume', label: 'Resume', heading: 'Resume' },
    // Reached via the nav CTA, not the nav links / home cards.
    login: { word: 'Login', label: 'Login', heading: 'Login' },
  },

  // Contact section: LinkedIn + a message form that relays through the server,
  // so the destination address never ships to the client.
  contact: {
    linkedin: 'https://www.linkedin.com/in/drewbermudez/',
    blurb: 'Find me on LinkedIn, or drop a message here and it will reach me.',
    thanks: 'Message sent. Thanks for reaching out!',
  },

  // Projects reel. `name` is also the swarm word when the project is open.
  // Each project has a recording or a still from the product.
  projects: [
    {
      name: 'Arbr',
      line: 'vibe-coding for frontend development',
      tint: 'rgba(53,224,255,0.07)',
      video: '/media/arbr.mp4',
      body: 'One of the earliest vibe-coding platforms in 2023 focused on frontend software development, Arbr was a direct competitor to gpt-engineer, which became Lovable. Built on GPT3.5 before agents and orchestration were common concepts, we introduced many forward-looking innovations including wrapping Reinforcement Learning (RL) to improve model performance, and a harness to introduce planning for the agent.',
    },
    {
      name: 'Babbit',
      line: 'AI development built around product behavior',
      tint: 'rgba(232,184,255,0.07)',
      poster: '/media/babbit.png',
      href: 'https://babbit.dev',
      linkLabel: 'Visit babbit.dev',
      body: 'A development platform where teams define what their product should do, and agents build and test changes against an approved plan. Babbit connects features, code, and evaluations in one product map, with cloud workspaces for agents and pull requests in your own GitHub repositories. We use it to build Babbit itself.',
    },
    {
      name: 'Toucan',
      line: 'a private world for two',
      tint: 'rgba(255,183,77,0.09)',
      video: '/media/toucan.mp4',
      poster: '/media/toucan.jpg',
      body: 'A native iOS app for partners to turn everyday connection into play: send dares, earn mangoes, create rewards for each other, and keep a shared space for conversations and memories. Built with SwiftUI and a Python backend, with end-to-end encryption for private content.',
      demoNote: 'Native iOS app · recorded in Simulator with sample data',
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

  resume: { href: '/resume.pdf' },

  accent: '#35E0FF',
};
