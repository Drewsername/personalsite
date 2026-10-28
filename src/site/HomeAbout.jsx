const about = [
  'I’m an AI Product Manager at Microsoft working on Copilot Studio (agentic workflows, orchestration, enterprise scale).',
  "Previously, I founded Dishie (Computer vision tech for dishwashing) and Arbr (software engineering agents). I like the 0-to-1 phase, but I love the 1-to-1B phase where data comes into play. I enjoy problems the most when they can only be solved optimally by expanding the solution space and combining business and technology decisions.",
  "I studied engineering at Carnegie Mellon ('17) and got my MBA at Yale ('24).",
  'I love to think in systems, and I advise early-stage teams on AI architecture, agentic systems, and technical org design.',
  "In my spare time, I'm finishing writing a speculative fiction novel, and hopefully I'll have more to say about that soon.",
  'When not at a keyboard, you can probably find me playing tennis, reading tech S-1 filings for fun, or catching a live set from the desert to the coast.',
];
const beliefs = [
  'Anything that can be measured can be solved.',
  'Intelligence in every human capacity is becoming a commodity. The areas where people believe AI will never be capable are a symptom of hubris.',
  'Companies need to be built around AI, rather than AI being retrofitted to work with how companies are currently structured.',
  'Quality communication is dense. Most AI-generated documents add noise to information rather than efficiency. Every line should either add or remove information.',
  'Code does not matter; only outcomes matter. Examples beat rules.',
  'Social simulation with agents will become as important as foundational models. The two spaces will converge because social simulation is inherently a form of eval.',
  "System 1 models are brilliant (TypeSafe's Jev and Cloudflare's Clairic are two of my favorite releases). Fast, sub-100ms probabilistic routing unlocks product surfaces that giant reasoning models can’t touch.",
  'Data will always be a moat for niche industries. There is a permanent compute-cost advantage for companies that build and fine-tune smaller models on their own proprietary datasets.',
];
export function HomeAbout() {
  return (
    <article className="mt-8 pb-8 text-[15px] leading-[1.85] sm:text-base">
      <p className="text-lg leading-relaxed">I build AI products and companies. Currently based in NYC.</p>
      <section className="mt-8">
        <h2 className="font-semibold">Some things about me:</h2>
        <ul className="mt-3 list-disc space-y-3 pl-5 marker:text-faint">
          {about.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="font-semibold">Some things I believe:</h2>
        <ul className="mt-3 list-disc space-y-3 pl-5 marker:text-faint">
          {beliefs.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="font-semibold">Things I’m thinking about:</h2>
        <ul className="mt-3 list-disc space-y-3 pl-5 marker:text-faint">
          <li><strong>Inverted data &amp; attention markets:</strong> Turning products people previously paid for into things they are <em>paid</em> to use in exchange for behavioral data (backed by eyes-off auditing and collective bargaining pipes).</li>
          <li><strong>The post-code bottleneck:</strong> Now that agentic coding makes building software trivial, the bottleneck shifts to dynamic storyboarding, automated A/B preference classifiers, and synthetic public-perception testing <em>before</em> customer discovery.</li>
          <li><strong>Prediction markets as information engines:</strong> Using collective intelligence and RAG-backed networks to arbitrage sentiment and price economic or clinical outcomes.</li>
          <li><strong>AI-native traditional businesses:</strong> Taking high-margin, labor-heavy legacy sectors and rebuilding them from the ground up where organizational knowledge is structured specifically for agents.</li>
        </ul>
      </section>
    </article>
  );
}
