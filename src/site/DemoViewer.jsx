import { useEffect, useRef } from 'react';

export function DemoViewer({ project, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog ref={ref} onCancel={onClose} onClose={onClose} aria-label={`${project.name} demo`}
      onKeyDown={(event) => event.stopPropagation()} onWheel={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()} onTouchMove={(event) => event.stopPropagation()} onTouchEnd={(event) => event.stopPropagation()}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-background p-0 text-foreground backdrop:bg-black">
      <video src={project.video} poster={project.poster} autoPlay muted loop playsInline controls
        className="h-full w-full object-contain" />
      <button type="button" onClick={onClose} autoFocus
        className="absolute right-4 top-4 cursor-pointer rounded-none border border-border bg-background/90 px-4 py-2 font-mono text-sm">
        Close demo ✕
      </button>
    </dialog>
  );
}
