import { useEffect, useRef } from 'react';

import {
  startUnityPortalRenderer,
  type PortalVariant,
} from '../rendering/portal-shader-renderer';

type PortalShaderProps = Readonly<{
  variant: PortalVariant;
}>;

export function PortalShader({ variant }: PortalShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    if (typeof WebGL2RenderingContext === 'undefined') {
      canvas.dataset.portalRendererStatus = 'unsupported';
      canvas.parentElement?.setAttribute('data-portal-renderer-status', 'unsupported');
      return undefined;
    }

    try {
      return startUnityPortalRenderer(canvas, variant);
    } catch (error) {
      canvas.dataset.portalRendererStatus = 'failed';
      canvas.parentElement?.setAttribute('data-portal-renderer-status', 'failed');
      console.warn('The Unity-compatible portal shader could not start.', error);
      return undefined;
    }
  }, [variant]);

  return (
    <span
      className="game-glyph__portal-energy"
      data-portal-alpha-source="product-r"
      data-portal-geometry="full-rect"
      data-portal-parameters="speed-0.5 strength-8 density-2 brightness-2"
      data-portal-postprocess="bloom-threshold-1 intensity-0.3 high-quality"
      data-portal-renderer-status="initializing"
      data-portal-shader="unity-14-twirl-voronoi"
      data-portal-texture-sample="rgba"
    >
      <canvas
        aria-hidden="true"
        className="game-glyph__portal-canvas"
        data-portal-animation="continuous"
        data-portal-color-conversion="unity-linear-to-srgb"
        data-portal-renderer="webgl2"
        data-portal-renderer-status="initializing"
        data-portal-time-conversion="milliseconds-to-seconds"
        ref={canvasRef}
      />
    </span>
  );
}
