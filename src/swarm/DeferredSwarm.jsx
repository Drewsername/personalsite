import { useEffect, useRef, useState } from 'react';

export function SwarmBackground({ controlRef, ...props }) {
  const [Renderer, setRenderer] = useState(null);
  const [painted, setPainted] = useState(false);
  const actual = useRef(null);
  const latest = useRef([0, 0, 0]);
  useEffect(() => {
    const proxy = { setMorph: (...args) => {
      latest.current = args;
      actual.current?.setMorph(...args);
    } };
    controlRef.current = proxy;
    let cancelled = false;
    let secondFrame;
    // Let the text paint before importing and initializing the WebGL renderer.
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        import('./SwarmBackground.jsx').then((mod) => {
          if (!cancelled) setRenderer(() => mod.SwarmBackground);
        });
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      if (controlRef.current === proxy) controlRef.current = null;
    };
  }, [controlRef]);
  return <>
    {!painted && <div className="instant-title" aria-hidden="true">{props.words[0]}</div>}
    {Renderer && <Renderer {...props} controlRef={actual} onFirstFrame={() => {
      actual.current?.setMorph(...latest.current);
      setPainted(true);
    }} />}
  </>;
}
