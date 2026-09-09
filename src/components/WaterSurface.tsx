import { useEffect, useRef } from 'react';
import { startWaterSurface } from '../rendering/water-surface';

/** Screen-space water is decorative; the rules never read its state. */
export function WaterSurface() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || typeof WebGL2RenderingContext === 'undefined') return;
    let stop = startWaterSurface(canvas, canvas.parentElement!);
    const restore = () => { stop(); stop = startWaterSurface(canvas, canvas.parentElement!); };
    canvas.addEventListener('webglcontextrestored', restore);
    return () => { canvas.removeEventListener('webglcontextrestored', restore); stop(); };
  }, []);
  return <canvas ref={ref} className="board__water-surface" aria-hidden="true" />;
}
