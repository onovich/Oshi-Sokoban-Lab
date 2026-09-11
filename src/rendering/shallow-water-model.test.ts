import { describe, expect, it } from 'vitest';
import { SHALLOW_WATER_UPDATE, SHALLOW_WATER_LIGHTING } from './shallow-water-model';
import { FLOW_STEP } from './water-flow-shader';
import { WATER_FRAGMENT } from './water-shaders';
import { step, display } from '../water-lab/shaders';
describe('lab C/runtime shader parity',()=>{
  it('embeds the identical two-pass height/velocity update in both shaders',()=>{
    expect(FLOW_STEP).toContain(SHALLOW_WATER_UPDATE);
    expect(step).toContain(SHALLOW_WATER_UPDATE);
    expect(FLOW_STEP).not.toContain('pressureAt');
    expect(FLOW_STEP).not.toContain('microRelief');
  });
  it('shares lab illumination rather than using the old faint alpha material',()=>{
    expect(display).toContain(SHALLOW_WATER_LIGHTING);
    expect(WATER_FRAGMENT).toContain(SHALLOW_WATER_LIGHTING);
    expect(WATER_FRAGMENT).toContain(')*70.');
    expect(display).toContain('100.:70.');
  });
});
