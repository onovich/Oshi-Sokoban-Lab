import type { LevelSpec } from '../../course/types';
import { e04SharedCourt } from './e04-shared-staging';

const id = 'lab-e04-small-court';
export const e04SmallCourt: LevelSpec = {
  ...e04SharedCourt,
  id,
  role: 'establish',
  cognitiveStage: 'seed',
  prerequisites: [],
  difficulty: { target: 3, confidence: 'design-target', sampleSize: 0 },
  board: {
    ...e04SharedCourt.board, id, title: '浅庭', height: 5,
    player: { x: 2, y: 1 },
    walls: [...e04SharedCourt.board.walls.filter(p => p.y < 5), {x:3,y:0}, {x:3,y:1}, {x:4,y:4}],
    terrainGoals: [{x:4,y:2}, {x:4,y:3}, {x:1,y:4}],
    blocks: [
      {...e04SharedCourt.board.blocks[0]!, id: `${id}-a`},
      {...e04SharedCourt.board.blocks[2]!, id: `${id}-c`, position: {x:2,y:2}},
    ],
  },
  theorem: {
    axioms: e04SharedCourt.theorem.axioms,
    proposition: '单格物的最终位置也是竖物的上推站位；必须先让竖物离开，再完成单格物。',
    proofConditions: [{kind:'sequence', events:[
      {key:`event:block-pushed:${id}-a:from:1,2:to:1,1`},
      {key:`event:block-pushed:${id}-c`},
    ]}],
    milestones: [],
    contrastVariable: '只开放 (0,2) 玩家推侧，使单格物提前完成后仍可继续。',
  },
};

const bridgeId = 'lab-e04-middle-court';
export const e04MiddleCourt: LevelSpec = {
  ...e04SharedCourt,
  id: bridgeId,
  role: 'transfer',
  cognitiveStage: 'transfer',
  prerequisites: [id],
  difficulty: { target: 4, authorRating: 5, confidence: 'design-target', sampleSize: 0 },
  board: {
    ...e04SharedCourt.board, id: bridgeId, title: '半庭',
    player: {x:2,y:1},
    blocks: e04SharedCourt.board.blocks.map(b => ({
      ...b, id:`${bridgeId}-${b.id.slice(-1)}`,
      position:b.id.endsWith('-b') ? {x:2,y:2} : b.id.endsWith('-c') ? {x:3,y:4} : b.position,
    })),
  },
  theorem: {
    ...e04SharedCourt.theorem,
    proposition: '单格物虽已暂放，仍不能抢先占用竖物的推侧；横物让路之后才能交接这片空间。',
    contrastVariable: '本题为协调迁移；只开放 (0,2) 不足以解除已下移横物的额外约束。',
    proofConditions: [{kind:'sequence', events:[
      {key:`event:block-pushed:${bridgeId}-b:from:2,2:to:2,3`},
      {key:`event:block-pushed:${bridgeId}-a:from:1,2:to:1,1`},
      {key:`event:block-pushed:${bridgeId}-c`},
    ]}],
    milestones: [],
  },
};

export const e04TeachingLevels: readonly LevelSpec[] = [e04SmallCourt, e04MiddleCourt];
