import { useEffect, useRef, useState } from 'react';
import { content } from './content.js';
import { DemoViewer } from './DemoViewer.jsx';

function ProjectMedia({ project, playing, detail = false }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (playing) ref.current.play().catch(() => {});
    else ref.current.pause();
  }, [playing]);
  const fit = detail || project.name === 'Toucan' ? 'object-contain' : 'object-cover';
  return project.video ? (
    <video ref={ref} src={project.video} poster={project.poster} muted loop playsInline preload={playing ? "metadata" : "none"}
      className={`h-full w-full ${fit}`} />
  ) : <img src={project.poster} alt={`${project.name} product screenshot`} className={`h-full w-full ${fit}`} />;
}

export function ProjectsSection({ open, onOpen, onClose, active = true }) {
  const [demo, setDemo] = useState(false);
  const [previousOpen, setPreviousOpen] = useState(open);
  if (previousOpen !== open) { setPreviousOpen(open); setDemo(false); }
  const project = content.projects[open];
  return (
    <div className="project-content">
      <div className="mx-auto max-w-[1080px]">
        {project ? (
          <>
            <button onClick={onClose} className="mb-5 cursor-pointer font-mono text-xs text-muted-foreground hover:text-foreground">← All projects</button>
            <article className="grid items-start gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
              <div className="overflow-hidden rounded-none border border-border bg-[#e8e5de]">
                <div className="h-[250px] sm:h-[320px] lg:h-[420px]">
                  <ProjectMedia project={project} playing={active} detail />
                </div>
                {project.video && <button onClick={() => setDemo(true)} className="w-full cursor-pointer border-t border-border bg-card px-5 py-3 text-left text-sm hover:bg-secondary">▶ Watch demo <span className="text-muted-foreground">· silent</span></button>}
              </div>
              <div className="rounded-none bg-background/90 p-1">
                <h2 className="text-2xl font-medium">{project.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{project.line}</p>
                <p className="mt-5 whitespace-pre-line text-[15px] leading-[1.8]">{project.body}</p>
                {project.href && <a href={project.href} target="_blank" rel="noreferrer" className="mt-5 inline-block text-sm underline underline-offset-4">{project.linkLabel} ↗</a>}
                {project.demoNote && <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{project.demoNote}</p>}
              </div>
            </article>
          </>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.projects.map((p, i) => (
              <button key={p.name} onClick={() => onOpen(i)} className="group grid cursor-pointer grid-cols-[110px_1fr] overflow-hidden rounded-none border border-border bg-background text-left transition-colors hover:border-foreground/40 sm:block">
                <div className="h-[124px] overflow-hidden bg-[#e8e5de] sm:h-[170px]">
                  <ProjectMedia project={p} playing={active} />
                </div>
                <div className="p-4">
                  <span className="mb-2 inline-block border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{p.period}</span>
                  <div className="flex items-baseline justify-between gap-3"><h2 className="text-lg font-medium">{p.name}</h2><span aria-hidden="true" className="text-muted-foreground">↗</span></div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{p.line}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {demo && project && <DemoViewer project={project} onClose={() => setDemo(false)} />}
    </div>
  );
}
