import { createWaterScene } from './water-scene';
import { WATER_FRAGMENT, WATER_VERTEX } from './water-shaders';
import { createWaterFlow } from './water-flow';

/** Bounded, presentation-only impulses. Positions are normalized to the board. */
export function startWaterSurface(canvas: HTMLCanvasElement, board: HTMLElement): () => void {
  const context = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false, antialias: false });
  if (!context) return () => {};
  const gl: WebGL2RenderingContext = context;
  const shaders: WebGLShader[] = [];
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!; shaders.push(shader);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'Water shader');
    return shader;
  };
  const program = gl.createProgram()!;
  try {
    gl.attachShader(program, compile(gl.VERTEX_SHADER, WATER_VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, WATER_FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Water shader link failed');
  } catch (error) {
    shaders.forEach(shader => gl.deleteShader(shader)); gl.deleteProgram(program);
    console.warn('Water surface unavailable', error); return () => {};
  }
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const textures = [0, 1].map(unit => {
    const texture = gl.createTexture()!; gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  });
  gl.uniform1i(gl.getUniformLocation(program, 'u_reflection'), 0);
  gl.uniform1i(gl.getUniformLocation(program, 'u_floor'), 1);
  const timeLocation = gl.getUniformLocation(program, 'u_time');
  const aspectLocation = gl.getUniformLocation(program, 'u_aspect');
  const impulsesLocation = gl.getUniformLocation(program, 'u_impulses[0]');
  const scene = createWaterScene(board);
  const flow = createWaterFlow(gl);
  const flowLocation=gl.getUniformLocation(program,'u_flow');
  const flowEnabledLocation=gl.getUniformLocation(program,'u_flowEnabled');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  type Impulse = { x: number; y: number; time: number; strength: number };
  const rainImpulses: Impulse[] = [];
  const cycles = new WeakMap<Element, number>();
  let frame = 0, stopped = false, dirty = true;
  const observer = new MutationObserver(() => { dirty = true; });
  observer.observe(board, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class'] });
  const resize = new ResizeObserver(() => { dirty = true; }); resize.observe(board);
  function draw(ms: number) {
    if (stopped) return;
    frame = requestAnimationFrame(draw);
    // Sample the current CSS animation on every browser frame, without temporal smoothing.
    if (document.hidden || (reduced.matches && !dirty)) return;
    dirty = false;
    const now = ms / 1000;
    const size = Math.max(1, Math.min(768, Math.round(board.clientWidth)));
    const state = scene.update(size);
    if (canvas.width !== state.width || canvas.height !== state.height) {
      canvas.width = state.width; canvas.height = state.height;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    const newDrops:number[][]=[];
    for (const drop of board.querySelectorAll<SVGElement>('[data-impact-x]')) {
      const animation = drop.getAnimations()[0];
      const timing = animation?.effect?.getTiming();
      if (!timing || typeof animation.currentTime !== 'number' || typeof timing.duration !== 'number') continue;
      const phase = (animation.currentTime - (timing.delay ?? 0)) / timing.duration;
      const cycle = Math.floor(phase - .78);
      if (!reduced.matches && cycles.has(drop) && cycles.get(drop) !== cycle) {
        rainImpulses.push({ x: Number(drop.dataset.impactX), y: Number(drop.dataset.impactY), time: now, strength: .8 });
        newDrops.push([Number(drop.dataset.impactX),Number(drop.dataset.impactY)]);
      }
      cycles.set(drop, cycle);
    }
    const flowTexture=flow?.update(state.moving,now,!reduced.matches,newDrops);
    gl.viewport(0,0,canvas.width,canvas.height);
    while (rainImpulses.length && (rainImpulses.length > 32 || now-rainImpulses[0]!.time > 1.4)) rainImpulses.shift();
    const values = new Float32Array(128);
    for (let i = 0; i < 32; i++) {
      const impulse = reduced.matches ? undefined : rainImpulses[i];
      values.set(impulse ? [impulse.x, impulse.y, now-impulse.time, impulse.strength] : [0,0,-1,0], i*4);
    }
    [scene.reflection, scene.mask].forEach((source, unit) => {
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, textures[unit]!);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    });
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,flowTexture??textures[0]!);
    gl.uniform1i(flowLocation,2);gl.uniform1f(flowEnabledLocation,flowTexture&&!reduced.matches?1:0);
    gl.uniform1f(timeLocation, reduced.matches ? 0 : now);
    gl.uniform1f(aspectLocation, canvas.width/canvas.height);
    gl.uniform4fv(impulsesLocation, values); gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  const preferenceChanged = () => { dirty = true; };
  reduced.addEventListener('change', preferenceChanged);
  frame = requestAnimationFrame(draw);
  const lost = (event: Event) => { event.preventDefault(); stopped = true; cancelAnimationFrame(frame); };
  canvas.addEventListener('webglcontextlost', lost);
  return () => {
    stopped = true; cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect();
    reduced.removeEventListener('change', preferenceChanged); canvas.removeEventListener('webglcontextlost', lost);
    textures.forEach(texture => gl.deleteTexture(texture)); gl.deleteBuffer(buffer);
    flow?.dispose();
    shaders.forEach(shader => gl.deleteShader(shader)); gl.deleteProgram(program);
  };
}
