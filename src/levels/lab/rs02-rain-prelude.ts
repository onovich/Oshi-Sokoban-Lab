import type { LevelSpec } from '../../course/types';
import { rs01RainStaging } from './rs01-rain-staging';

// Reachable subproblems of 泊庭. The original board and historical ID stay unchanged.
function prelude(id: string, title: string, second: boolean): LevelSpec {
  const positions = [{ x: 4, y: 0 }, second ? { x: 1, y: 3 } : { x: 3, y: 2 },
    second ? { x: 3, y: 2 } : { x: 3, y: 3 }];
  return {
    id, groupId: 'lab-rain-prelude', role: second ? 'transfer' : 'establish',
    cognitiveStage: second ? 'transfer' : 'seed',
    prerequisites: second ? ['lab-rs02-inner-bank'] : ['lesson-36'],
    techniques: rs01RainStaging.techniques,
    difficulty: { target: second ? 5 : 4, confidence: 'design-target', sampleSize: 0 },
    board: {
      ...rs01RainStaging.board, id, title,
      player: second ? { x: 2, y: 2 } : { x: 4, y: 3 },
      blocks: rs01RainStaging.board.blocks.map((block, index) => ({
        ...block, id: `${id}-${['a', 'b', 'c'][index]}`, position: positions[index]!,
      })),
    },
    theorem: {
      axioms: rs01RainStaging.theorem.axioms,
      proposition: second
        ? '小块先向下暂存，让横块在上方横向对齐，再移开小块完成交接。'
        : '小块必须先左移离开横块下方，并保持可取回，横块才能向下收尾。',
      proofConditions: [
        ...(second ? [{ kind: 'event' as const, event: { key: `event:block-pushed:${id}-c:from:3,2:to:3,3` as const } }] : []),
        { kind: 'event', event: { key: `event:block-pushed:${id}-c:from:3,3:to:2,3` } },
      ],
      milestones: [{ kind: 'event', event: { key: `event:block-pushed:${id}-c:from:3,3:to:2,3` } }],
    },
  };
}

export const rainPreludes: readonly LevelSpec[] = [
  prelude('lab-rs02-inner-bank', '汊岸', false),
  prelude('lab-rs03-waiting-bank', '候岸', true),
];
