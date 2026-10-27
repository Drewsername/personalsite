import { useEffect, useRef, useState } from 'react';
import { SwarmBackground } from './swarm/DeferredSwarm.jsx';
import { content } from './site/content.js';
import { HomeAbout } from './site/HomeAbout.jsx';
import { ResumeSection } from './site/Resume.jsx';
import { ContactSection } from './site/Contact.jsx';
import { LoginSection } from './site/Login.jsx';
import { ProjectsSection } from './site/Projects.jsx';

const sections = [{ id: 'top', label: 'About' }, { id: 'projects', label: 'Projects' }, { id: 'resume', label: 'Resume' }, { id: 'contact', label: 'Contact' }];
const words = [content.name, 'Projects', 'Resume', 'Contact', 'Login'];
const config = {
  density: 0.045, maxCount: 130000, speed: 11, ballRadius: [5, 12],
  omega: 1, beta: 1.2, base: 0.18, bgDark: 0.015, mono: 0.85, dim: 0.9,
  speedScale: 0.5, omegaScale: 0.5,
};

export default function App() {
  const swarmRef = useRef(null);
  const projectsRef = useRef(null);
  const scrollRef = useRef(null);
  const [active, setActive] = useState(0);
  const [openProject, setOpenProject] = useState(-1);
  const [projectsVisible, setProjectsVisible] = useState(false);
  const [utility, setUtility] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setProjectsVisible(entry.isIntersecting));
    observer.observe(projectsRef.current);
  return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const followHash = () => {
      const id = window.location.hash.slice(1);
      if (id === 'login') setUtility(id);
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
    };
    followHash();
    window.addEventListener('hashchange', followHash);
    return () => window.removeEventListener('hashchange', followHash);
  }, []);

  useEffect(() => {
    if (utility) document.getElementById(utility)?.scrollIntoView({ block: 'start' });
  }, [utility]);

    // The same scroll position drives the side-nav opacity and the title morph.
  useEffect(() => {
    const scroller = scrollRef.current;
    let frame = 0;
    const update = () => {
      const ids = [...sections.map((section) => section.id), ...(utility ? ['login'] : [])];
      const line = scroller.getBoundingClientRect().top + Math.min(140, scroller.clientHeight * 0.25);
      let from = 0;
      let to = 0;
      let blend = 0;
      ids.forEach((id, i) => {
        if (!i) return;
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top === undefined) return;
        if (top <= line) { from = i; to = i; blend = 0; }
        else if (top < line + 140) { from = i - 1; to = i; blend = 1 - (top - line) / 140; }
      });
      swarmRef.current?.setMorph(from, to, blend * blend * (3 - 2 * blend));
      setActive(blend > 0.5 ? to : from);
    };
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    return () => { cancelAnimationFrame(frame); scroller.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [utility, openProject]);


  return (
    <>
      <SwarmBackground words={words} config={config} controlRef={swarmRef} />
      <nav className="side-nav" aria-label="Sections">
        {sections.map((section, i) => <a key={section.id} href={`#${section.id}`} aria-current={active === i ? 'location' : undefined} style={{ opacity: active === i ? 1 : 0.4 }}>{section.label}</a>)}
      </nav>
      <main ref={scrollRef} className="site-scroll" tabIndex={0} aria-label="Portfolio">
        <section id="top" className="page-section scroll-mt-4">
          <h1 className="sr-only">Drew Bermudez</h1>
          <HomeAbout />
        </section>
        <section id="projects" ref={projectsRef} className="page-section mt-16 scroll-mt-4">
          <h2 className="mb-6 border-b border-border pb-3 text-2xl font-medium">Projects</h2>
          <ProjectsSection open={openProject} onOpen={setOpenProject} onClose={() => setOpenProject(-1)} active={projectsVisible} />
        </section>
        <section id="resume" className="page-section mt-16 scroll-mt-4">
          <h2 className="mb-6 border-b border-border pb-3 text-2xl font-medium">Resume</h2>
          <ResumeSection />
        </section>
        <section id="contact" className="page-section mt-16 scroll-mt-4 pb-6">
          <h2 className="mb-6 border-b border-border pb-3 text-2xl font-medium">Contact</h2>
          <ContactSection />
        </section>
        {utility && <section id="login" className="page-section mt-12 scroll-mt-4 pb-4">
          <h2 className="mb-5 text-2xl font-medium">Login</h2>
          <LoginSection />
        </section>}
      </main>
      <footer className="site-footer">
        <a href="#login" onClick={() => setUtility('login')}>Login</a>
      </footer>
    </>
  );
}
