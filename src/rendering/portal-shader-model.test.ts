import { describe, expect, it } from 'vitest';

import {
  UNITY_PORTAL_PARAMETERS,
  portalFrameAtElapsedMs,
  sampleUnityPortalField,
  sourceGateAssetAlphaAtTexel,
  unityLinearToSrgb,
  unityTwirlUv,
} from './portal-shader-model';

describe('Unity portal shader model', () => {
  it('converts browser milliseconds to Unity seconds before applying Speed as a UV offset', () => {
    const frame = portalFrameAtElapsedMs(2_000, UNITY_PORTAL_PARAMETERS);

    expect(frame.timeSeconds).toBe(2);
    expect(frame.twirlOffset).toEqual({ x: 1, y: 1 });
  });

  it('uses the Shader Graph radial Twirl formula in normalized UV space', () => {
    const warped = unityTwirlUv(
      { x: 1, y: 0.5 },
      { center: { x: 0.5, y: 0.5 }, strength: 8, offset: { x: 0.5, y: 0.5 } },
    );

    expect(warped.x).toBeCloseTo(0.673178, 5);
    expect(warped.y).toBeCloseTo(0.621599, 5);
  });

  it('converts HDR Color properties exactly as Shader Graph 14 does in a Gamma project', () => {
    expect(unityLinearToSrgb(144.98065)).toBeCloseTo(8.3357023, 6);
    expect(unityLinearToSrgb(41.22311)).toBeCloseTo(4.9135284, 6);
    expect(unityLinearToSrgb(29.475334)).toBeCloseTo(4.2654296, 6);
    expect(unityLinearToSrgb(89.63017)).toBeCloseTo(6.8121266, 6);
    expect(unityLinearToSrgb(109.62756)).toBeCloseTo(7.413253, 6);
  });

  it('keeps the asset alpha audit separate from the shader channel contract', () => {
    let opaqueTexels = 0;
    for (let y = 0; y < 16; y += 1) {
      for (let x = 0; x < 16; x += 1) {
        opaqueTexels += sourceGateAssetAlphaAtTexel({ x, y });
      }
    }

    expect(opaqueTexels).toBe(152);
    expect(sourceGateAssetAlphaAtTexel({ x: 1, y: 1 })).toBe(1);
    expect(sourceGateAssetAlphaAtTexel({ x: 2, y: 2 })).toBe(0);
    expect(sourceGateAssetAlphaAtTexel({ x: 3, y: 3 })).toBe(1);
    expect(sourceGateAssetAlphaAtTexel({ x: 15, y: 15 })).toBe(0);
  });

  it('produces a continuously changing deterministic Voronoi field', () => {
    const uv = { x: 0.35, y: 0.61 };
    const first = sampleUnityPortalField(uv, portalFrameAtElapsedMs(0, UNITY_PORTAL_PARAMETERS));
    const second = sampleUnityPortalField(uv, portalFrameAtElapsedMs(250, UNITY_PORTAL_PARAMETERS));

    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeCloseTo(0.05175154, 7);
    expect(second).toBeGreaterThanOrEqual(0);
    expect(second).toBeCloseTo(0.08953694, 7);
  });

  it.each([
    [{ x: 0.5, y: 0.5 }, 0, 0.1085445207],
    [{ x: 0.5, y: 0.5 }, 250, 0.4087457378],
    [{ x: 0.5, y: 0.5 }, 1_000, 0.0456645468],
    [{ x: 0.25, y: 0.25 }, 0, 0.3297175651],
    [{ x: 0.75, y: 0.5 }, 0, 0.3206527396],
  ] as const)('matches the Shader Graph 14 golden field at UV %o and %d ms', (uv, timeMs, expected) => {
    const frame = portalFrameAtElapsedMs(timeMs, UNITY_PORTAL_PARAMETERS);

    expect(sampleUnityPortalField(uv, frame)).toBeCloseTo(expected, 7);
  });

  it('freezes the field when the material Speed is zero', () => {
    const parameters = { ...UNITY_PORTAL_PARAMETERS, speed: 0 };
    const uv = { x: 0.27, y: 0.73 };

    expect(sampleUnityPortalField(uv, portalFrameAtElapsedMs(0, parameters))).toBe(
      sampleUnityPortalField(uv, portalFrameAtElapsedMs(25_000, parameters)),
    );
  });
});
