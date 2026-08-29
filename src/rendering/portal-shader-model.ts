export type Point2 = Readonly<{ x: number; y: number }>;

export type UnityPortalParameters = Readonly<{
  angleOffset: number;
  brightness: number;
  density: number;
  speed: number;
  strength: number;
}>;

export type PortalFrame = Readonly<{
  parameters: UnityPortalParameters;
  timeSeconds: number;
  twirlOffset: Point2;
}>;

export const UNITY_PORTAL_PARAMETERS: UnityPortalParameters = Object.freeze({
  angleOffset: 2,
  brightness: 2,
  density: 2,
  speed: 0.5,
  strength: 8,
});

export const UNITY_PORTAL_HDR_COLORS = Object.freeze({
  blue: Object.freeze({ r: 29.475334, g: 89.63017, b: 109.62756 }),
  orange: Object.freeze({ r: 144.98065, g: 41.22311, b: 0 }),
});

export const SOURCE_GATE_MASK = Object.freeze({
  coreMax: 12,
  coreMin: 3,
  frameMax: 14,
  frameMin: 1,
  size: 16,
});

const UINT32_MAX = 0xffff_ffff;
const UINT_HASH_SEED = 1_103_515_245;
const UINT_HASH_MULTIPLIER = 0x27d4_eb2d;

function hashTchou2To2(input: Point2): Point2 {
  let x = Math.round(input.x) >>> 0;
  let y = Math.round(input.y) >>> 0;

  y = (y ^ UINT_HASH_SEED) >>> 0;
  x = (x + y) >>> 0;
  x = Math.imul(x, y) >>> 0;
  x = (x ^ (x >>> 5)) >>> 0;
  x = Math.imul(x, UINT_HASH_MULTIPLIER) >>> 0;
  y = (y ^ (x << 3)) >>> 0;

  return {
    x: x / UINT32_MAX,
    y: y / UINT32_MAX,
  };
}

function unityVoronoiRandomVector(input: Point2, angleOffset: number): Point2 {
  const hash = hashTchou2To2(input);

  return {
    x: Math.sin(hash.y * angleOffset) * 0.5 + 0.5,
    y: Math.cos(hash.x * angleOffset) * 0.5 + 0.5,
  };
}

function fract(value: number): number {
  return value - Math.floor(value);
}

export function unityLinearToSrgb(value: number): number {
  return value <= 0.0031308
    ? value * 12.92
    : 1.055 * value ** (1 / 2.4) - 0.055;
}

export function sourceGateAssetAlphaAtTexel(pixel: Point2): 0 | 1 {
  const { coreMax, coreMin, frameMax, frameMin, size } = SOURCE_GATE_MASK;
  if (pixel.x < 0 || pixel.x >= size || pixel.y < 0 || pixel.y >= size) return 0;

  const inFrameBounds = pixel.x >= frameMin
    && pixel.x <= frameMax
    && pixel.y >= frameMin
    && pixel.y <= frameMax;
  const inFrame = inFrameBounds && (
    pixel.x === frameMin
    || pixel.x === frameMax
    || pixel.y === frameMin
    || pixel.y === frameMax
  );
  const inCore = pixel.x >= coreMin
    && pixel.x <= coreMax
    && pixel.y >= coreMin
    && pixel.y <= coreMax;

  return inFrame || inCore ? 1 : 0;
}

export function portalFrameAtElapsedMs(
  elapsedMs: number,
  parameters: UnityPortalParameters = UNITY_PORTAL_PARAMETERS,
): PortalFrame {
  const timeSeconds = elapsedMs / 1_000;
  const offset = timeSeconds * parameters.speed;

  return {
    parameters,
    timeSeconds,
    twirlOffset: { x: offset, y: offset },
  };
}

export function unityTwirlUv(
  uv: Point2,
  options: Readonly<{ center: Point2; strength: number; offset: Point2 }>,
): Point2 {
  const deltaX = uv.x - options.center.x;
  const deltaY = uv.y - options.center.y;
  const angle = options.strength * Math.hypot(deltaX, deltaY);
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);

  return {
    x: cosine * deltaX - sine * deltaY + options.center.x + options.offset.x,
    y: sine * deltaX + cosine * deltaY + options.center.y + options.offset.y,
  };
}

function unityVoronoi(uv: Point2, angleOffset: number, density: number): number {
  const scaledX = uv.x * density;
  const scaledY = uv.y * density;
  const gridX = Math.floor(scaledX);
  const gridY = Math.floor(scaledY);
  const fractionX = fract(scaledX);
  const fractionY = fract(scaledY);
  let closestDistance = 8;

  for (let y = -1; y <= 1; y += 1) {
    for (let x = -1; x <= 1; x += 1) {
      const lattice = { x, y };
      const offset = unityVoronoiRandomVector(
        { x: lattice.x + gridX, y: lattice.y + gridY },
        angleOffset,
      );
      const deltaX = lattice.x + offset.x - fractionX;
      const deltaY = lattice.y + offset.y - fractionY;
      closestDistance = Math.min(closestDistance, Math.hypot(deltaX, deltaY));
    }
  }

  return closestDistance;
}

export function sampleUnityPortalField(uv: Point2, frame: PortalFrame): number {
  const warpedUv = unityTwirlUv(uv, {
    center: { x: 0.5, y: 0.5 },
    strength: frame.parameters.strength,
    offset: frame.twirlOffset,
  });
  const distance = unityVoronoi(
    warpedUv,
    frame.parameters.angleOffset,
    frame.parameters.density,
  );

  return distance ** frame.parameters.brightness;
}
