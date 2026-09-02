import type {
  CourseGroupDefinition,
  LessonRole,
  LevelSpec,
  LevelTheorem,
} from '../engine/types';
import { authoredCourse } from './authored-course';

type GroupSeed = Readonly<{
  slug: string;
  title: string;
  branch: CourseGroupDefinition['branch'];
  prerequisites: readonly string[];
  completionPrerequisites?: readonly string[];
  axiom: string;
  propositions: readonly [string, string, string];
}>;

const groupSeeds: readonly GroupSeed[] = [
  { slug: 'push-side', title: '推侧访问', branch: 'foundation', prerequisites: [], axiom: 'Block 只能从玩家所在的相反方向被推一格。', propositions: ['开放推侧足以完成基础推动。', '目标接近不等于具备推动站位。', '完成顺序会改变剩余推侧的可达性。'] },
  { slug: 'footprint-clearance', title: '完整 footprint', branch: 'shape', prerequisites: ['g01-push-side'], axiom: '多格实体移动时，其完整 footprint 必须都能落位。', propositions: ['多格实体的所有组成格一起移动。', '任一组成格受阻都会拒绝整次移动。', '实体腾出的远端格可以成为新的通路或支点。'] },
  { slug: 'full-coverage', title: '完整覆盖', branch: 'shape', prerequisites: ['g02-footprint-clearance'], axiom: '真实 Block 的完整 footprint 都被兼容 Goal 覆盖才算完成。', propositions: ['完整 footprint 必须全部覆盖 Goal。', '只覆盖锚点或局部 footprint 不会完成。', '正确目标图案还必须保留最终推侧。'] },
  { slug: 'number-match', title: '数字匹配', branch: 'shape', prerequisites: ['g03-full-coverage'], axiom: '数字 Goal 只覆盖同号 Block；Terrain Goal 为通配目标。', propositions: ['同号 Block 与 Goal 可以匹配。', '异号 Goal 不能完成 Block，Terrain Goal 可以。', '形状覆盖与数字身份必须同时成立。'] },
  { slug: 'goal-allocation', title: '目标分配', branch: 'shape', prerequisites: ['g04-number-match'], axiom: '每个真实 Block 都必须获得一组兼容且完整的目标格。', propositions: ['兼容目标需要按约束分配。', '最近的兼容目标可能破坏另一物体的推侧。', '选择较多的物体必须为选择唯一的物体让位。'] },
  { slug: 'fake-block', title: 'Fake Block', branch: 'fake', prerequisites: ['g01-push-side'], axiom: 'Fake Block 参与碰撞和推动，但不参与胜利判定。', propositions: ['Fake 可以移动以清出道路。', 'Fake 覆盖 Goal 不会计入胜利。', 'Fake 可以作为临时墙、刹车或推动支点。'] },
  { slug: 'spike-rebirth', title: 'Spike：销毁与重生', branch: 'spike', prerequisites: ['g01-push-side'], axiom: '可移动物触刺后消失，并在自己的出生点重新出现。', propositions: ['触刺可以清除挡路物，而物件会在出生点重生。', '真实 Block 与 Fake 一样会回到自己的出生点。', '只有触刺物件重生，此前完成的盘面进度会保留。'] },
  { slug: 'spike-origin', title: 'Spike：另一边', branch: 'spike', prerequisites: ['g07-spike-rebirth'], completionPrerequisites: ['g07-spike-rebirth'], axiom: '物件的出生点也是触刺后唯一且可预测的返回端点。', propositions: ['物件重生可以让推动者留在另一侧。', '出生点被占用时重生动作被拒绝。', '出生点占用可以控制远程返回发生的时机。'] },
  { slug: 'spike-side', title: 'Spike：往返', branch: 'spike', prerequisites: ['g08-spike-origin'], axiom: '物体回到 origin，推动者仍留在触发位置的近侧。', propositions: ['回位会把玩家留在物体另一侧。', '错误时机的回位仍会封闭所需路线。', '回原位可作为改变推侧的远程返回边。'] },
  { slug: 'movable-goal', title: '可移动 Goal', branch: 'goal', prerequisites: ['g01-push-side'], axiom: 'Movable Goal 在前方可放置时会像物体一样被推动。', propositions: ['Goal 可以移动以改变目标位置。', '移动 Goal 同时改变目标和局部通路。', 'Goal 的最终落点与通路作用必须共同规划。'] },
  { slug: 'goal-mode', title: 'Goal 推动/穿过', branch: 'goal', prerequisites: ['g10-movable-goal'], axiom: 'Movable Goal 可推动时被推；不可推动时玩家可走到其上。', propositions: ['Goal 前方空闲时进入推动模式。', 'Goal 前方受阻时进入可穿过模式。', '玩家可以主动在推与穿之间切换以取得另一侧站位。'] },
  { slug: 'rain-stop', title: 'Rain 停止点', branch: 'rain', prerequisites: ['g01-push-side'], axiom: 'Rain 中无邻接动作的方向输入会持续滑到第一个阻挡前。', propositions: ['边界和墙决定滑行终点。', '不同阻挡位置会改变同一路径的落点。', '可移动物可以被安排成玩家自己的刹车。'] },
  { slug: 'rain-adjacency', title: 'Rain 与邻接动作', branch: 'rain', prerequisites: ['g12-rain-stop'], axiom: 'Rain 中存在邻接可行动作时，输入优先执行一次局部动作。', propositions: ['邻接 Block 时输入执行一步推动。', '移开邻接物后同一输入恢复长滑。', '解法需要有意切换局部动作与滑行。'] },
  { slug: 'gate-direction', title: 'Gate 方向保持', branch: 'gate', prerequisites: ['g01-push-side'], axiom: '角色从配对 Gate 出口沿入射方向再落一格。', propositions: ['Gate 穿越保持输入方向。', '不同入射方向产生不同出口落点。', '远端推侧可由入口方向携带过去。'] },
  { slug: 'gate-remote', title: 'Gate 远端条件', branch: 'gate', prerequisites: ['g14-gate-direction'], axiom: '出口落点畅通时穿越；受阻时才尝试推动入口。', propositions: ['出口畅通时 Gate 是通道。', '出口受阻且入口前方可放置时 Gate 被推动。', '玩家可主动制造远端阻挡来切换 Gate 模式。'] },
  { slug: 'gate-topology', title: 'Gate 拓扑改写', branch: 'gate', prerequisites: ['g15-gate-remote'], axiom: '移动 Gate 端点不会解除其配对关系。', propositions: ['推动端点会改变远程连接位置。', '配对关系在端点移动后保持。', '移动、使用、再利用端点可重写可达区域。'] },
  { slug: 'footprint-spike', title: 'Footprint × Spike', branch: 'combination', prerequisites: ['g02-footprint-clearance', 'g08-spike-origin'], axiom: '多格实体任一组成格触刺都会让整件实体尝试回位。', propositions: ['任一组成格都能触发整体回位。', '回位落点检查完整 origin footprint。', '远端组成格可以成为整体的遥控触发器。'] },
  { slug: 'goal-rain', title: 'Goal × Rain', branch: 'combination', prerequisites: ['g10-movable-goal', 'g12-rain-stop'], axiom: 'Movable Goal 既阻挡 Rain 滑行，也保持自身推/穿状态。', propositions: ['Goal 可以成为雨中停止物。', 'Goal 的位置同时改变滑行落点和目标位置。', 'Goal 必须先作为刹车使用，再作为终点使用。'] },
  { slug: 'rain-gate', title: 'Rain × Gate', branch: 'combination', prerequisites: ['g12-rain-stop', 'g15-gate-remote'], axiom: 'Rain 把角色送入 Gate，Gate 仍按该输入方向计算出口落点。', propositions: ['滑行可以直接进入并穿过 Gate。', '出口受阻会阻止普通穿越。', '远端阻挡可把滑行输入转化为 Gate 推动序列。'] },
  { slug: 'number-fake', title: 'Number × Fake', branch: 'combination', prerequisites: ['g04-number-match', 'g06-fake-block'], axiom: '数字兼容性与是否属于真实任务是两条独立规则。', propositions: ['同号 Fake 仍不属于胜利集合。', 'Fake 可以占用兼容 Goal 但不会完成任务。', 'Fake 的位置与真实 Block 的稀缺目标分配必须联合规划。'] },
  { slug: 'gate-spike', title: 'Gate × Spike', branch: 'combination', prerequisites: ['g09-spike-side', 'g16-gate-topology'], axiom: 'Gate 端点触刺后独立回 origin，配对关系保持。', propositions: ['Gate 端点可以被 Spike 重置。', '单端点回位不会解除配对。', '移动、重置与穿越可以形成可控的拓扑循环。'] },
] as const;

const boundaryContrastBySlug: Readonly<Record<string, string>> = {
  'push-side': '目标距离不变；目标后方站位从可达变为不可达',
  'footprint-clearance': '锚点路径不变；一个远端 footprint 格由空闲变为受阻',
  'full-coverage': '锚点对齐不变；完整 footprint 的 Goal 覆盖由完整变为局部',
  'number-match': '形状与落点不变；Goal 编号由兼容变为不兼容',
  'goal-allocation': '目标距离更近；另一物体可用的兼容目标由有余量变为唯一',
  'fake-block': '位置与外形保持可比；Block 的任务身份由真实变为 Fake',
  'spike-rebirth': '地图与触刺路线不变；接触物身份由 Fake 变为已完成的真实 Block',
  'spike-origin': '触刺路径不变；origin footprint 由空闲变为被玩家占用',
  'spike-side': '回位规则不变；触发侧与所需最终推侧相反',
  'movable-goal': 'Goal 可推动性不变；Goal 位置开始同时阻断玩家通路',
  'goal-mode': '同一 Goal 与输入方向不变；前方落位格由空闲变为受阻',
  'rain-stop': '输入方向不变；路径上的首个停止物位置改变',
  'rain-adjacency': '输入方向不变；相邻格由无动作变为存在可推动物',
  'gate-direction': 'Gate 配对不变；进入端点的入射方向改变',
  'gate-remote': '入口与输入不变；配对出口后的落点由空闲变为受阻',
  'gate-topology': 'Gate 配对 ID 不变；一个端点的位置发生移动',
  'footprint-spike': '触刺机制不变；origin 的一个远端 footprint 格由空闲变为受阻',
  'goal-rain': '天气与输入不变；Movable Goal 的位置改变 Rain 停止点',
  'rain-gate': 'Rain 轨迹与入口不变；Gate 出口落点由空闲变为受阻',
  'number-fake': '数字与形状保持兼容；任务身份由真实 Block 变为 Fake',
  'gate-spike': '只重置一个 Gate 端点；另一端点及 nextGateId 保持不变',
};

const roles: readonly LessonRole[] = ['establish', 'boundary', 'inference'];

function groupId(index: number, seed: GroupSeed): string {
  return `g${String(index + 1).padStart(2, '0')}-${seed.slug}`;
}

function lessonId(index: number): string {
  return `lesson-${String(index + 1).padStart(2, '0')}`;
}

export const courseGroups: readonly CourseGroupDefinition[] = groupSeeds.map((seed, groupIndex) => {
  const first = groupIndex * 3;
  return {
    id: groupId(groupIndex, seed),
    title: seed.title,
    branch: seed.branch,
    prerequisites: seed.prerequisites,
    completionPrerequisites: seed.completionPrerequisites,
    levelIds: [lessonId(first), lessonId(first + 1), lessonId(first + 2)],
  };
});

export const courseLevels: readonly LevelSpec[] = groupSeeds.flatMap((seed, groupIndex) => {
  const id = groupId(groupIndex, seed);
  return roles.map((role, roleIndex) => {
    const index = groupIndex * 3 + roleIndex;
    const authored = authoredCourse[index];
    if (!authored) throw new Error(`Missing authored lesson ${lessonId(index)}.`);
    const theorem: LevelTheorem = {
      axioms: [seed.axiom],
      proposition: seed.propositions[roleIndex],
      requiredPredicates: authored.requiredPredicates,
      criticalEvent: authored.criticalEvent,
      contrastVariable: role === 'boundary' ? boundaryContrastBySlug[seed.slug] : undefined,
      readabilityElements: authored.readabilityElements,
    };
    return {
      id: lessonId(index),
      groupId: id,
      role,
      prerequisites: seed.prerequisites,
      board: authored.board,
      theorem,
    };
  });
});
