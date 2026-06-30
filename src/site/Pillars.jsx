import { content } from './content.js';
import { Section } from './Section.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function Pillars() {
  return (
    <Section id="pillars" style={{ paddingTop: 0 }}>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
        {content.pillars.map((p, i) => (
          <a key={p.id} href={`#${p.id}`} className="group block transition-transform hover:-translate-y-0.5">
            <Card className="h-full gap-4 py-7 transition-colors group-hover:bg-secondary group-hover:ring-foreground/20">
              <CardHeader className="gap-3">
                <div className="font-mono text-xs tracking-[1px] text-primary">0{i + 1}</div>
                <CardTitle className="text-[21px] font-medium">{p.title}</CardTitle>
                <CardDescription className="text-[15px]">{p.blurb}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-[13px] text-primary">Explore →</div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </Section>
  );
}
