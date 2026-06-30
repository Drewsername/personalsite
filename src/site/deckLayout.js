// Shared vertical layout for the panel deck, expressed as fractions of the
// VIEWPORT HEIGHT so the split is identical at every screen width — width only
// shrinks the swarm word horizontally, never moves it vertically. The swarm word
// lives in a band in the top third; panel content starts below it. Keep these in
// lockstep: CONTENT_TOP must sit below the word band (WORD_CY + WORD_BAND/2).

export const WORD_CY = 0.24; // vertical centre of the word band
export const WORD_BAND = 0.28; // total stacked height of the word
export const CONTENT_TOP = 0.42; // content begins here (leaves a clear gap)
