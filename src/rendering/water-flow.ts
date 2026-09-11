import { FLOW_STEP } from './water-flow-shader';
import { contactBase, contactVelocity, type WaterContact } from './water-contact';

/** Owns scheme C's GPU state; never reads or writes puzzle logic. */
export function createWaterFlow(gl: WebGL2RenderingContext) {
  if (!gl.getExtension('EXT_color_buffer_float')) return null;
  const textures: WebGLTexture[] = [], frames: WebGLFramebuffer[] = [], shaders: WebGLShader[] = [];
  const program=gl.createProgram()!;
  const vao=gl.createVertexArray()!;
  const dispose=()=>{ textures.forEach(t=>gl.deleteTexture(t));frames.forEach(f=>gl.deleteFramebuffer(f));
    shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);gl.deleteVertexArray(vao); };
  try {
    for(const [type,source] of [[gl.VERTEX_SHADER,`#version 300 es
out vec2 uv;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`],[gl.FRAGMENT_SHADER,FLOW_STEP]] as const){
      const s=gl.createShader(type)!;shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)??'Flow compile');gl.attachShader(program,s);
    }
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)??'Flow link');
    function texture(){const t=gl.createTexture()!;textures.push(t);gl.bindTexture(gl.TEXTURE_2D,t);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,128,128,0,gl.RGBA,gl.FLOAT,null);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;}
    function target(){const t=texture(),f=gl.createFramebuffer()!;frames.push(f);gl.bindFramebuffer(gl.FRAMEBUFFER,f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);
      if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Flow framebuffer');
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);return {t,f};}
    const states=[target(),target()],boundary=texture(),forcing=texture();
    const fieldLoc=gl.getUniformLocation(program,'field'),forceLoc=gl.getUniformLocation(program,'forcing');
    const dropsLoc=gl.getUniformLocation(program,'drops[0]'),rainLoc=gl.getUniformLocation(program,'rainCount');
    const boundaryLoc=gl.getUniformLocation(program,'boundary'),passLoc=gl.getUniformLocation(program,'pass');
    let index=0,lastTime=0,accumulator=0;
    let pendingDrops:number[][]=[];
    let previous=new Map<string,WaterContact>();
    const pixels=new Float32Array(128*128*4),oldMask=new Float32Array(128*128);
    const forces=new Float32Array(128*128*4);
    function run(pass:number,f:WebGLFramebuffer){gl.useProgram(program);gl.bindVertexArray(vao);gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.viewport(0,0,128,128);
      [states[index]!.t,forcing,boundary].forEach((t,u)=>{gl.activeTexture(gl.TEXTURE0+u);gl.bindTexture(gl.TEXTURE_2D,t);});
      const drops=new Float32Array(64);pendingDrops.slice(0,32).forEach((d,i)=>drops.set(d,i*2));
      gl.uniform2fv(dropsLoc,drops);gl.uniform1i(rainLoc,Math.min(32,pendingDrops.length));
      gl.uniform1i(fieldLoc,0);gl.uniform1i(forceLoc,1);gl.uniform1i(boundaryLoc,2);gl.uniform1i(passLoc,pass);gl.drawArrays(gl.TRIANGLES,0,3);}
    return {dispose, update(contacts:WaterContact[], now:number, enabled:boolean, raindrops:number[][]=[]){
      const elapsed=lastTime?now-lastTime:0;lastTime=now;
      // Undo/restart, hidden-tab resumption and reduced motion discard stale momentum.
      const discontinuity=contacts.some(c=>{const p=previous.get(c.id);return p&&
        (Math.abs(c.x-p.x)>c.width*.75||Math.abs(c.y-p.y)>c.height*.75);});
      if(!enabled||elapsed>.1||discontinuity){accumulator=0;pendingDrops=[];
        for(const t of states){gl.bindFramebuffer(gl.FRAMEBUFFER,t.f);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);}}
      if(enabled)pendingDrops.push(...raindrops);
      pendingDrops=pendingDrops.slice(-32);
      pixels.fill(0);
      forces.fill(0);
      for(let i=0;i<oldMask.length;i++)pixels[i*4+3]=oldMask[i]!;
      for(const c of contacts){const b=contactBase(c),v=enabled?contactVelocity(c,previous.get(c.id),elapsed):[0,0];
        for(let y=Math.max(0,Math.floor(b.top*128));y<Math.min(128,Math.ceil(b.bottom*128));y++)
          for(let x=Math.max(0,Math.floor(b.left*128));x<Math.min(128,Math.ceil(b.right*128));x++){
            const i=(y*128+x)*4;pixels[i]=1;pixels[i+1]=v[0]!;pixels[i+2]=v[1]!;}}
      // Lab rectangle-distance Gaussian, generalized to the strongest nearby base.
      for(const c of contacts.filter(c=>!c.id.startsWith('wall:'))){
        const b=contactBase(c),v=enabled?contactVelocity(c,previous.get(c.id),elapsed):[0,0];
        for(let y=Math.max(0,Math.floor((b.top-.06)*128));y<Math.min(128,Math.ceil((b.bottom+.06)*128));y++)
          for(let x=Math.max(0,Math.floor((b.left-.06)*128));x<Math.min(128,Math.ceil((b.right+.06)*128));x++){
            const qx=(x+.5)/128,qy=(y+.5)/128;
            const gx=Math.max(b.left-qx,0,qx-b.right),gy=Math.max(b.top-qy,0,qy-b.bottom);
            const edge=Math.exp(-(gx*gx+gy*gy)/.00025),i=(y*128+x)*4;
            if(edge>forces[i]!){forces[i]=edge;forces[i+1]=v[0]!;forces[i+2]=v[1]!;}
          }
      }
      gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,boundary);
      gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,128,128,gl.RGBA,gl.FLOAT,pixels);
      gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,forcing);
      gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,128,128,gl.RGBA,gl.FLOAT,forces);
      accumulator+=enabled?Math.min(elapsed,.04):0;
      while(accumulator>=1/120){run(0,states[1-index]!.f);index=1-index;
        run(1,states[1-index]!.f);index=1-index;accumulator-=1/120;pendingDrops=[];}
      for(let i=0;i<oldMask.length;i++)oldMask[i]=pixels[i*4]!;
      previous=new Map(contacts.map(c=>[c.id,c]));
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.bindVertexArray(null);
      return states[index]!.t;
    }};
  } catch(error){dispose();gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.bindVertexArray(null);console.warn('Flow unavailable; retaining rain/reflections',error);return null;}
}
