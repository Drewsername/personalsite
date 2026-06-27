import { useMemo } from 'react';
import { GLSwarmView } from './swarm/GLSwarmView.jsx';
import { scenePaint, sceneOutlinePaint } from './swarm/paints.js';

export default function App() {
  const paint = useMemo(() => scenePaint({ name: 'Drew Bermudez', button: 'ENTER' }), []);
  const overlay = useMemo(() => sceneOutlinePaint({ name: 'Drew Bermudez', button: 'ENTER', opacity: 0.5 }), []);

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <GLSwarmView
        paint={paint}
        overlay={overlay}
        blur={1}
        config={{
          density: 0.05,
          maxCount: 150000,
          speed: 11,
          ballRadius: [5, 12],
          omega: 1.0,
          beta: 1.2,
          base: 0.07,
          mono: 0.85,
          dim: 0.45,
          speedScale: 0.5,
          omegaScale: 0.5,
        }}
        interactive={{ onClick: () => console.log('enter'), hoverIntensity: 1.9 }}
      />
    </div>
  );
}
