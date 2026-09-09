/** Rasterizes the actual visible glyphs, including their animated screen-space positions. */
export function createWaterScene(board: HTMLElement) {
  const reflection = document.createElement('canvas');
  const mask = document.createElement('canvas');
  const ctx = reflection.getContext('2d')!;
  const floor = mask.getContext('2d')!;
  const sprites = new Map<string, HTMLCanvasElement>();

  function spriteFor(svg: SVGSVGElement): HTMLCanvasElement {
    const shapes = [...svg.querySelectorAll('path,rect,polygon')];
    const paints = shapes.map(shape => {
      const style = getComputedStyle(shape);
      return { fill: style.fill, stroke: style.stroke, width: style.strokeWidth };
    });
    const key = svg.innerHTML + JSON.stringify(paints);
    const cached = sprites.get(key);
    if (cached) return cached;
    const image = document.createElement('canvas'); image.width = image.height = 96;
    const draw = image.getContext('2d')!; draw.scale(3, 3);
    shapes.forEach((shape, index) => {
      let path: Path2D;
      if (shape.tagName === 'path') path = new Path2D(shape.getAttribute('d') ?? '');
      else if (shape.tagName === 'polygon') {
        path = new Path2D('M' + (shape.getAttribute('points') ?? '').trim().replaceAll(' ', 'L') + 'Z');
      } else {
        path = new Path2D(); path.rect(Number(shape.getAttribute('x')), Number(shape.getAttribute('y')),
          Number(shape.getAttribute('width')), Number(shape.getAttribute('height')));
      }
      const paint = paints[index]!;
      if (paint.fill !== 'none') { draw.fillStyle = paint.fill; draw.fill(path); }
      if (paint.stroke !== 'none') { draw.strokeStyle = paint.stroke; draw.lineWidth = parseFloat(paint.width); draw.stroke(path); }
    });
    if (sprites.size > 128) sprites.clear();
    sprites.set(key, image);
    return image;
  }

  return { reflection, mask, update(size: number) {
    // The canvas fills the padding box, not the border box. Use the same origin.
    const outer = board.getBoundingClientRect();
    const bounds = { left: outer.left + board.clientLeft, top: outer.top + board.clientTop,
      width: board.clientWidth, height: board.clientHeight };
    const height = Math.max(1, Math.round(size * bounds.height / bounds.width));
    if (reflection.width !== size || reflection.height !== height) {
      reflection.width = mask.width = size; reflection.height = mask.height = height;
    }
    ctx.clearRect(0, 0, size, height);
    floor.fillStyle = 'white'; floor.fillRect(0, 0, size, height);
    const sx = size / bounds.width, sy = height / bounds.height;
    const moving: { id: string; x: number; y: number; width: number; height: number }[] = [];
    const pieces = [...board.querySelectorAll<HTMLElement>('.board__entity')];
    const ordinal = new Map<string, number>();
    for (const piece of pieces) {
      const glyph = piece.querySelector<HTMLElement>('[data-glyph]');
      if (!glyph) continue;
      const paint = getComputedStyle(piece);
      if (Number(paint.opacity) < .05 || paint.display === 'none') continue;
      const box = piece.getBoundingClientRect();
      const x = (box.left - bounds.left) * sx, y = (box.top - bounds.top) * sy;
      const w = box.width * sx, h = box.height * sy;
      const id = piece.dataset.entityId ?? '';
      const n = ordinal.get(id) ?? 0; ordinal.set(id, n + 1);
      moving.push({ id: `${id}:${n}`, x: (x + w / 2) / size, y: (y + h) / height, width: w / size, height: h / height });
      const svg = glyph.querySelector<SVGSVGElement>('svg');
      const portal = glyph.querySelector<HTMLCanvasElement>('canvas');
      const image = portal?.width ? portal : svg ? spriteFor(svg) : undefined;
      if (!image) continue;
      ctx.save();
      ctx.globalAlpha = Number(paint.opacity);
      ctx.translate(x, y + h); ctx.scale(1, -.38);
      ctx.drawImage(image, 0, -h, w, h);
      ctx.restore();
      // Fade with distance from contact. Use a local destination-out gradient.
      ctx.save(); ctx.globalCompositeOperation = 'destination-out';
      const fade = ctx.createLinearGradient(0, y + h, 0, y + h * 1.38);
      fade.addColorStop(0, 'rgba(0,0,0,0.15)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = fade; ctx.fillRect(x, y + h, w, h * .38 + 1); ctx.restore();
    }
    // Water cannot paint walls or solid pieces. Goals remain legible above this layer.
    for (const element of board.querySelectorAll<HTMLElement>('[data-terrain="wall"],.board__entity--block,.board__entity--fake-block,.board__entity--player')) {
      const box = element.getBoundingClientRect(); floor.fillStyle = 'black';
      floor.fillRect((box.left - bounds.left) * sx, (box.top - bounds.top) * sy, box.width * sx, box.height * sy);
    }
    board.querySelectorAll<HTMLElement>('[data-terrain="wall"]').forEach((element,index)=>{
      const box=element.getBoundingClientRect();
      moving.push({id:`wall:${index}`,x:(box.left-bounds.left+box.width/2)/bounds.width,
        y:(box.top-bounds.top+box.height)/bounds.height,width:box.width/bounds.width,height:box.height/bounds.height});
    });
    return { moving, width: size, height };
  } };
}
