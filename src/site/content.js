// Single source of truth for all site copy. Edit here.
// [placeholder] markers are content for Drew to replace.

export const content = {
  name: 'Drew Bermudez',
  tagline: 'creative technologist',

  nav: [
    { id: 'consulting', label: 'Consulting' },
    { id: 'work', label: 'Work' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ],

  pillars: [
    { id: 'consulting', icon: 'scale', title: 'Legal consulting', blurb: 'Advisory, deals, and strategy for founders and teams.' },
    { id: 'work', icon: 'sparkles', title: 'Creative work', blurb: 'Interactive experiments and engineered visuals.' },
  ],

  consulting: {
    intro: '[placeholder] One or two sentences on who you help and the outcomes you deliver — the through-line that makes a prospective client feel understood.',
    services: [
      { title: '[placeholder] Advisory', body: 'Ongoing counsel on contracts, structure, and risk.' },
      { title: '[placeholder] Transactions', body: 'Hands-on support through deals and negotiations.' },
      { title: '[placeholder] Strategy', body: 'Translating legal complexity into clear decisions.' },
    ],
    cta: { label: 'Book a consult', href: 'mailto:drewtbermudez@gmail.com?subject=Consulting%20enquiry' },
  },

  work: [
    { title: 'Swarm', blurb: 'A WebGL field of identical balls that resolves into text by additive color overlap.', href: '#' },
    { title: '[placeholder] Project two', blurb: 'Short blurb describing the work and your role.', href: '#' },
    { title: '[placeholder] Project three', blurb: 'Short blurb describing the work and your role.', href: '#' },
  ],

  about: {
    body: "[placeholder] A short bio that bridges both sides — the lawyer's discipline and the builder's curiosity — in your own voice. Two or three sentences is plenty.",
  },

  contact: {
    email: 'drewtbermudez@gmail.com',
    calendar: '', // [placeholder] paste a calendar link (Cal.com / Calendly) to enable the button
    socials: [
      { label: 'GitHub', href: '#' },
      { label: 'LinkedIn', href: '#' },
    ],
  },

  accent: '#35E0FF',
};
