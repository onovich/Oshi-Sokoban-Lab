import { describe, expect, it } from 'vitest';
import { contactBase, contactVelocity } from './water-contact';
const piece={id:'block',x:.5,y:.6,width:.2,height:.2};
describe('side-view water contact',()=>{
  it('uses the bottom half as the hidden base, not the complete face',()=>{
    expect(contactBase(piece)).toEqual({left:.4,right:.6,top:.5,bottom:.6});
  });
  it('uses animated displacement without lag smoothing',()=>{
    expect(contactVelocity({...piece,x:.51},piece,.02)[0]).toBeCloseTo(.5);
  });
  it('does not generate a wake across teleports or restored states',()=>{
    expect(contactVelocity({...piece,x:.9},piece,.02)).toEqual([0,0]);
    expect(contactVelocity(piece,undefined,.02)).toEqual([0,0]);
    expect(contactVelocity({...piece,x:.51},piece,1)).toEqual([0,0]);
  });
});
