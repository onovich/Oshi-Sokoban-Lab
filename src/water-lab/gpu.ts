import { vertex, step, display } from './shaders';

export function createExperiment(canvas: HTMLCanvasElement, mode: number) {
  const context = canvas.getContext('webgl2', { antialias: false });
  if (!context || !context.getExtension('EXT_color_buffer_float')) throw new Error('需要 WebGL2 和浮点渲染目标；本设备不支持，未用假动画替代。');
  const gl = context;
  const shaders: WebGLShader[] = [], programs: WebGLProgram[] = [];
  function program(fragment: string) {
    const p = gl.createProgram()!; programs.push(p);
    for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
      const shader = gl.createShader(type)!; shaders.push(shader);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'Shader compile failed');
      gl.attachShader(p, shader);
    }
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'Shader link failed');
    return p;
  }
  const update = program(step), render = program(display);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  function target() {
    const texture = gl.createTexture()!, framebuffer = gl.createFramebuffer()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 128,128,0,gl.RGBA,gl.FLOAT,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('浮点帧缓冲不可用');
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    return {texture,framebuffer};
  }
  const state=[target(),target()], pressure=[target(),target()];
  const locations = new Map<WebGLProgram, Map<string, WebGLUniformLocation | null>>();
  function loc(p: WebGLProgram,name:string) {
    let cache=locations.get(p);if(!cache){cache=new Map();locations.set(p,cache);}
    if(!cache.has(name))cache.set(name,gl.getUniformLocation(p,name));return cache.get(name)!;
  }
  let current=0,pc=0,needsDetailSeed=true;
  let block=[.65,.55],oldBlock=[.65,.55],velocity=[0,0],drop=[0,0],rain=0;
  function run(p:WebGLProgram, output:WebGLFramebuffer|null, pass:number, debug=false, footprint=false) {
    gl.useProgram(p);gl.bindFramebuffer(gl.FRAMEBUFFER,output);
    gl.viewport(0,0,output?128:canvas.width,output?128:canvas.height);
    const a=gl.getAttribLocation(p,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,state[current]!.texture);
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,pressure[pc]!.texture);
    gl.uniform1i(loc(p,'stateTex'),0);gl.uniform1i(loc(p,'pressureTex'),1);
    gl.uniform2fv(loc(p,'block'),block);gl.uniform2fv(loc(p,'oldBlock'),oldBlock);
    gl.uniform2fv(loc(p,'velocity'),velocity);gl.uniform2fv(loc(p,'drop'),drop);
    gl.uniform1f(loc(p,'rain'),rain);gl.uniform1i(loc(p,'mode'),mode);gl.uniform1i(loc(p,'pass'),pass);
    gl.uniform1f(loc(p,'debugView'),debug?1:0);gl.uniform1f(loc(p,'footprintView'),footprint?1:0);gl.drawArrays(gl.TRIANGLES,0,6);
  }
  return {
    step(next:number[],previous:number[],raindrop:number[]|null) {
      block=next;oldBlock=previous;velocity=next.map((v,i)=>(v-previous[i]!)*120);
      drop=raindrop??[0,0];rain=raindrop?1:0;
      if(mode===1&&needsDetailSeed){
        run(update,state[1-current]!.framebuffer,3);current=1-current;needsDetailSeed=false;
      }
      run(update,state[1-current]!.framebuffer,0);current=1-current;
      if(mode===1){
        for(let i=0;i<24;i++){run(update,pressure[1-pc]!.framebuffer,1);pc=1-pc;}
        run(update,state[1-current]!.framebuffer,2);current=1-current;
      }else if(mode===2){run(update,state[1-current]!.framebuffer,1);current=1-current;}
    },
    draw(debug:boolean, footprint=false) {
      if(canvas.closest('article')?.hidden)return;
      const bounds=canvas.getBoundingClientRect();
      const scale=Math.min(devicePixelRatio||1,2);
      const width=Math.max(1,Math.min(1920,Math.round(bounds.width*scale)));
      const height=Math.max(1,Math.round(width*bounds.height/Math.max(1,bounds.width)));
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      run(render,null,0,debug,footprint);
    },
    diagnose() {
      const pixels=new Float32Array(128*128*4);
      gl.bindFramebuffer(gl.FRAMEBUFFER,state[current]!.framebuffer);
      gl.readPixels(0,0,128,128,gl.RGBA,gl.FLOAT,pixels);
      let mean=0,peak=0,speed=0,finite=true;
      for(let i=0;i<pixels.length;i+=4){
        mean+=pixels[i]!;peak=Math.max(peak,Math.abs(pixels[i]!));
        speed=Math.max(speed,Math.hypot(pixels[i+1]!,pixels[i+2]!));
        finite&&=Number.isFinite(pixels[i]!)&&Number.isFinite(pixels[i+1]!)&&Number.isFinite(pixels[i+2]!);
      }
      return finite?(mode===1?`有限值 ✓ · 最大流速 ${speed.toFixed(3)}`:
        `有限值 ✓ · 水位均值 ${(mean/16384).toFixed(4)} · 峰值 ${peak.toFixed(4)}`):'数值异常：请重置';
    },
    reset() {needsDetailSeed=true;for(const t of [...state,...pressure]){gl.bindFramebuffer(gl.FRAMEBUFFER,t.framebuffer);gl.clear(gl.COLOR_BUFFER_BIT);}},
    dispose(){for(const t of [...state,...pressure]){gl.deleteTexture(t.texture);gl.deleteFramebuffer(t.framebuffer);}programs.forEach(p=>gl.deleteProgram(p));shaders.forEach(s=>gl.deleteShader(s));gl.deleteBuffer(buffer);},
  };
}
