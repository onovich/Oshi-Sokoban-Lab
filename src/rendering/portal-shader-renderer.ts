import {
  UNITY_PORTAL_HDR_COLORS,
  UNITY_PORTAL_PARAMETERS,
  type UnityPortalParameters,
} from './portal-shader-model';

export type PortalVariant = keyof typeof UNITY_PORTAL_HDR_COLORS;

const VERTEX_SHADER_SOURCE = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;
precision highp int;

in vec2 v_uv;
out vec4 fragmentColor;

uniform float u_angleOffset;
uniform float u_brightness;
uniform vec3 u_hdrColor;
uniform float u_density;
uniform float u_speed;
uniform float u_strength;
uniform float u_timeSeconds;

uvec2 hashTchou2To2(uvec2 value) {
  value.y ^= 1103515245u;
  value.x += value.y;
  value.x *= value.y;
  value.x ^= value.x >> 5u;
  value.x *= 0x27d4eb2du;
  value.y ^= value.x << 3u;
  return value;
}

vec2 unityVoronoiRandomVector(vec2 inputValue, float angleOffset) {
  uvec2 hash = hashTchou2To2(uvec2(ivec2(round(inputValue))));
  vec2 normalizedHash = vec2(hash) * (1.0 / 4294967295.0);
  return vec2(
    sin(normalizedHash.y * angleOffset),
    cos(normalizedHash.x * angleOffset)
  ) * 0.5 + 0.5;
}

vec2 unityTwirl(vec2 uv, vec2 center, float strength, vec2 offset) {
  vec2 delta = uv - center;
  float angle = strength * length(delta);
  float x = cos(angle) * delta.x - sin(angle) * delta.y;
  float y = sin(angle) * delta.x + cos(angle) * delta.y;
  return vec2(x + center.x + offset.x, y + center.y + offset.y);
}

float unityLinearToSrgb(float value) {
  return value <= 0.0031308
    ? value * 12.92
    : 1.055 * pow(value, 1.0 / 2.4) - 0.055;
}

vec3 unityLinearToSrgb(vec3 value) {
  return vec3(
    unityLinearToSrgb(value.r),
    unityLinearToSrgb(value.g),
    unityLinearToSrgb(value.b)
  );
}

float unityVoronoi(vec2 uv, float angleOffset, float cellDensity) {
  vec2 grid = floor(uv * cellDensity);
  vec2 fraction = fract(uv * cellDensity);
  vec3 result = vec3(8.0, 0.0, 0.0);

  for (int y = -1; y <= 1; y += 1) {
    for (int x = -1; x <= 1; x += 1) {
      vec2 lattice = vec2(float(x), float(y));
      vec2 offset = unityVoronoiRandomVector(lattice + grid, angleOffset);
      float distanceToPoint = distance(lattice + offset, fraction);
      if (distanceToPoint < result.x) {
        result = vec3(distanceToPoint, offset.x, offset.y);
      }
    }
  }

  return result.x;
}

void main() {
  float timeOffset = u_timeSeconds * u_speed;
  vec2 warpedUv = unityTwirl(v_uv, vec2(0.5), u_strength, vec2(timeOffset));
  float distanceField = unityVoronoi(warpedUv, u_angleOffset, u_density);
  float energy = pow(distanceField, u_brightness);
  vec3 hdrColor = unityLinearToSrgb(u_hdrColor) * energy;
  // The source graph connects the same Vector4 product to Base Color and
  // scalar Alpha. Shader Graph narrows the scalar input to its first channel.
  // Its RGBA texture samples are white in RGB, while the Gate texture alpha is
  // never consumed. The SpriteRenderer uses FullRect geometry, so no mask is
  // applied here either.
  fragmentColor = vec4(hdrColor, hdrColor.r);
}`;

const portalEpochMs = typeof performance === 'undefined' ? 0 : performance.now();

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Unable to allocate a WebGL shader.');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? 'Unknown shader compile error.';
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function createProgram(gl: WebGL2RenderingContext): WebGLProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error('Unable to allocate a WebGL program.');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? 'Unknown shader link error.';
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

function requiredAttribute(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): number {
  const location = gl.getAttribLocation(program, name);
  if (location < 0) {
    throw new Error(`Portal shader attribute not found: ${name}`);
  }
  return location;
}

function requiredUniform(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
): WebGLUniformLocation {
  const location = gl.getUniformLocation(program, name);
  if (!location) {
    throw new Error(`Portal shader uniform not found: ${name}`);
  }
  return location;
}

function fitDrawingBuffer(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(16, Math.ceil(bounds.width * pixelRatio));
  const height = Math.max(16, Math.ceil(bounds.height * pixelRatio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  gl.viewport(0, 0, width, height);
}

export function startUnityPortalRenderer(
  canvas: HTMLCanvasElement,
  variant: PortalVariant,
  parameters: UnityPortalParameters = UNITY_PORTAL_PARAMETERS,
): () => void {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    stencil: false,
  });
  const energyLayer = canvas.parentElement;

  if (!gl) {
    canvas.dataset.portalRendererStatus = 'unsupported';
    energyLayer?.setAttribute('data-portal-renderer-status', 'unsupported');
    return () => undefined;
  }

  const program = createProgram(gl);
  const positionBuffer = gl.createBuffer();
  if (!positionBuffer) {
    gl.deleteProgram(program);
    throw new Error('Unable to allocate the portal geometry buffer.');
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.useProgram(program);

  const positionLocation = requiredAttribute(gl, program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const timeLocation = requiredUniform(gl, program, 'u_timeSeconds');
  gl.uniform1f(requiredUniform(gl, program, 'u_angleOffset'), parameters.angleOffset);
  gl.uniform1f(requiredUniform(gl, program, 'u_brightness'), parameters.brightness);
  gl.uniform1f(requiredUniform(gl, program, 'u_density'), parameters.density);
  gl.uniform1f(requiredUniform(gl, program, 'u_speed'), parameters.speed);
  gl.uniform1f(requiredUniform(gl, program, 'u_strength'), parameters.strength);

  const color = UNITY_PORTAL_HDR_COLORS[variant];
  gl.uniform3f(requiredUniform(gl, program, 'u_hdrColor'), color.r, color.g, color.b);
  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);

  let animationFrame = 0;
  let disposed = false;
  const render = (nowMs: number) => {
    if (disposed) return;
    fitDrawingBuffer(canvas, gl);
    gl.uniform1f(timeLocation, (nowMs - portalEpochMs) / 1_000);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    canvas.dataset.portalRendererStatus = 'running';
    energyLayer?.setAttribute('data-portal-renderer-status', 'running');
    animationFrame = window.requestAnimationFrame(render);
  };

  const resizeObserver = typeof ResizeObserver === 'undefined'
    ? null
    : new ResizeObserver(() => fitDrawingBuffer(canvas, gl));
  resizeObserver?.observe(canvas);
  animationFrame = window.requestAnimationFrame(render);

  return () => {
    disposed = true;
    window.cancelAnimationFrame(animationFrame);
    resizeObserver?.disconnect();
    gl.deleteBuffer(positionBuffer);
    gl.deleteProgram(program);
  };
}
