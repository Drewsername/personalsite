import { content } from './content.js';
import { Label, Heading } from './Section.jsx';

export function ResumeSection() {
  return (
    <div>
      <Label>Resume</Label>
      <Heading>Drew Bermudez</Heading>
      <p className="mt-5 text-muted-foreground">Product management, applied AI, and building products.</p>
      <a href={content.resume.href} className="mt-6 inline-flex rounded-full border border-primary/40 bg-primary/10 px-5 py-3 font-mono text-sm text-primary hover:bg-primary/20">
        View resume (PDF) ↗
      </a>
    </div>
  );
}
