import { Download } from 'lucide-react';
import { content } from './content.js';

const experience = [
  {
    company: 'Microsoft', context: 'Copilot Studio, Applied AI & Research', location: 'Redmond, WA',
    role: 'Product Manager II', dates: '2024 – 2026',
    points: [
      "Product lead from research through launch for Copilot Studio’s first fine-tuned model — post-training approach (DPO, SPO), data curation, evaluation, requirements, and rollout.",
      'Owned the measurement layer for two production LLM services (document RAG, NL-to-SQL): defined the online answer-rate metric and the preview/GA ship gates — pass rate, 90% groundedness, 80% recall@3, P95 latency.',
      'Raised answer rates 60% → 80% and 68% → 80% against a 75% GA bar with a rigorous quality roadmap and a daily quality cadence across research, data science, engineering, and product; earned a 140%-of-target annual rewards outcome.',
      'Grew evaluation coverage from ~775 to 12k+ queries with a question-categorization taxonomy so offline test sets mirrored production traffic and predicted online impact; originated the semantic telemetry workstream behind it.',
      'Shipped multimodal images-in-files, code interpreter, agent web browsing, and Graph RAG retrieval; won platform commitments against training on customer data, unblocking $10M+ ARR in deals with key strategic customers.',
    ],
    earlier: 'MBA Product Management Intern, Copilot AI — 1 of 8 MBA PM interns globally; led the launch of an LLM-based B2B product.',
  },
  {
    company: 'Arbr', context: 'AI coding platform', role: 'Founder', dates: '2023 – 2024',
    points: [
      'Founded a cloud AI coding platform using reinforcement learning to make GPT-3.5/4-era models reason through agentic workflows, before reasoning models existed; pivoted toward agents for SaaS migrations.',
      'Raised a pre-seed with six-figure institutional commitments and a term-sheet-stage lead; reached final rounds of the Sequoia and Neo accelerators; wound down after the CTO’s departure, returning all capital.',
    ],
  },
  {
    company: 'Humatics', context: 'RF positioning for robotics', location: 'Waltham, MA', role: 'Application Engineer', dates: '2021 – 2022',
    points: ['Worked with the CEO and SVP of Sales on product-market fit for a novel RF positioning system, driving a company-wide sales pivot; ran the technical sale and pilot for a multinational customer generating >25% of annual revenue.'],
  },
  {
    company: 'Seegrid', context: 'Autonomous mobile robots', location: 'Pittsburgh, PA', role: 'Implementation Engineer · Field Engineer · Quality Control Technician', dates: '2018 – 2021',
    points: ['Oversaw 15+ deployments over $5M for F100 customers including Amazon, GM, Tesla, and UPS; led engineering for a demo to the USPS CEO and Board of Governors that converted to a >$20M contract.'],
  },
];
const skills = [
  ['Evaluation', 'Test-set design and coverage, rubrics and automated graders, offline ↔ online validation, groundedness and retrieval metrics, shadow and A/B testing, ship-bar definition'],
  ['Modeling', 'Post-training (DPO, SPO), fine-tuning data curation, RAG and Graph RAG, LLM APIs; Python, SQL, TypeScript / React, C++, agentic coding (Claude Code, Codex, Cursor)'],
  ['Community', 'Co-founder, CMU Tech & Entrepreneurship (CMU’s largest alumni community, 10k+ members) and the Yale SOM AI Association; guest lecturer on startup pitching, CMU MBAs; invited speaker, Yale Responsible AI Conference'],
];
const sectionHeading = 'mb-6 border-b border-border pb-3 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground';

export function ResumeSection() {
  return (
    <article aria-label="Drew Bermudez resume" className="pb-8">
      <header className="border-b border-border pb-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h2 className="text-2xl font-medium sm:text-3xl">Drew Bermudez</h2>
            <p className="mt-2 text-sm text-muted-foreground">New York, NY <span aria-hidden="true">·</span> <a className="underline underline-offset-4 hover:text-foreground" href="https://linkedin.com/in/drewbermudez">LinkedIn</a></p>
          </div>
          <a href={content.resume.href} download="Drew-Bermudez-Resume.pdf" className="inline-flex items-center gap-2 border border-primary bg-primary px-4 py-3 text-sm text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-4">
            <Download size={16} aria-hidden="true" /> Download PDF
          </a>
        </div>
        <p className="mt-5 max-w-[650px] text-base leading-relaxed">Product manager at the interface of research and product, turning model research into shipped products.</p>
      </header>
      <section className="mt-8" aria-labelledby="resume-experience">
        <h3 id="resume-experience" className={sectionHeading}>Experience</h3>
        <div className="space-y-9">
          {experience.map((job) => (
            <section key={job.company}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h4 className="text-lg font-medium">{job.company}</h4>
                <p className="font-mono text-xs text-muted-foreground">{job.dates}</p>
              </div>
              <p className="mt-1 text-sm">{job.role}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{job.context}{job.location && ` · ${job.location}`}</p>
              <ul className="mt-4 list-disc space-y-3 pl-4 text-sm leading-6 marker:text-faint">
                {job.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
              {job.earlier && <p className="mt-5 border-l border-border pl-4 text-sm leading-6"><span className="mb-1 block font-mono text-xs text-muted-foreground">2023</span>{job.earlier}</p>}
            </section>
          ))}
        </div>
      </section>
      <section className="mt-10" aria-labelledby="resume-education">
        <h3 id="resume-education" className={sectionHeading}>Education</h3>
        <div className="space-y-5 text-sm leading-6">
          <div><div className="flex flex-wrap justify-between gap-x-4"><h4 className="font-medium">Yale School of Management</h4><span className="font-mono text-xs text-muted-foreground">2024</span></div><p>MBA; Dean’s Scholarship, Diaz Nesamoney MBA Scholar, Greenberg Scholar</p></div>
          <div><div className="flex flex-wrap justify-between gap-x-4"><h4 className="font-medium">Carnegie Mellon University</h4><span className="font-mono text-xs text-muted-foreground">2017</span></div><p>BS, Mechanical Engineering; II-VI and Frank Scholarships; Robotics Club</p></div>
        </div>
      </section>
      <section className="mt-10" aria-labelledby="resume-skills">
        <h3 id="resume-skills" className={sectionHeading}>Technical &amp; community</h3>
        <dl className="space-y-5 text-sm leading-6">{skills.map(([label, text]) => <div key={label}><dt className="font-medium">{label}</dt><dd className="mt-1 text-muted-foreground">{text}</dd></div>)}</dl>
      </section>
    </article>
  );
}
