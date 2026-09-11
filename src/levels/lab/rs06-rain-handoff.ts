import type { LevelSpec } from '../../course/types';
import { rainStopPrelude } from './rs04-rain-stop';

const id = 'lab-rs06-crossing-bank';
export const rainHandoff: LevelSpec = {
  id, groupId: 'lab-rain-handoff', role: 'transfer', cognitiveStage: 'transfer',
  prerequisites: ['lesson-36'], techniques: rainStopPrelude.techniques,
  difficulty: { target: 4, confidence: 'design-target', sampleSize: 0 },
  board: {
    ...rainStopPrelude.board, id, title: '交岸', player: {x:3,y:1},
    terrainGoals: [{x:4,y:2},{x:3,y:4},{x:4,y:4}],
    blocks: rainStopPrelude.board.blocks.map((block,index)=>({
      ...block, id: `${id}-${index===0?'b':'c'}`,
      position: index===0 ? {x:1,y:2} : {x:3,y:2},
    })),
  },
  theorem: {
    axioms: rainStopPrelude.theorem.axioms,
    proposition: '小块先下放让横块通过，再左移腾出收尾通道，不能先完成小块。',
    proofConditions: [
      {kind:'event',event:{key:`event:block-pushed:${id}-c:from:3,2:to:3,3`}},
      {kind:'event',event:{key:`event:block-pushed:${id}-c:from:3,3:to:2,3`}},
    ],
    milestones: [{kind:'event',event:{key:`event:block-pushed:${id}-c:from:3,3:to:2,3`}}],
  },
};
