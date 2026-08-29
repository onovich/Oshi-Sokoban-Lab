export type Cell = Readonly<{
  x: number;
  y: number;
}>;

export type Direction = 'up' | 'down' | 'left' | 'right';
export type Weather = 'clear' | 'rain';
export type GameStatus = 'playing' | 'won' | 'lost';

export type ShapedEntityDefinition = Readonly<{
  id: string;
  position: Cell;
  shape: readonly Cell[];
}>;

export type BlockDefinition = ShapedEntityDefinition &
  Readonly<{
    number: number;
    isFake: boolean;
  }>;

export type GoalDefinition = ShapedEntityDefinition &
  Readonly<{
    number: number;
    movable: boolean;
  }>;

export type GateDefinition = ShapedEntityDefinition &
  Readonly<{
    nextGateId?: string;
  }>;

export type SpikeDefinition = ShapedEntityDefinition;
export type WallDefinition = ShapedEntityDefinition;

export type PathDefinition = Readonly<{
  id: string;
  travelerId: string;
  nodes: readonly Cell[];
  loop: 'once' | 'loop' | 'pingPong';
}>;

export type LessonPhase = 'guide' | 'verify' | 'challenge';

export type CurriculumDefinition = Readonly<{
  familyId: string;
  familyTitle: string;
  techniqueId: string;
  techniqueTitle: string;
  phase: LessonPhase;
}>;

export type LevelDefinition = Readonly<{
  id: string;
  title: string;
  description?: string;
  mechanics?: readonly string[];
  objective?: string;
  hint?: string;
  curriculum?: CurriculumDefinition;
  width: number;
  height: number;
  weather: Weather;
  player: Cell;
  walls: readonly Cell[];
  dynamicWalls?: readonly WallDefinition[];
  terrainGoals: readonly Cell[];
  terrainSpikes: readonly Cell[];
  blocks: readonly BlockDefinition[];
  goals: readonly GoalDefinition[];
  gates: readonly GateDefinition[];
  spikes: readonly SpikeDefinition[];
  paths: readonly PathDefinition[];
  stepLimit?: number;
  timeLimitSeconds?: number;
}>;

export type PositionedEntity<T extends ShapedEntityDefinition> = Omit<T, 'position'> &
  Readonly<{
    position: Cell;
    origin: Cell;
  }>;

export type PathState = Readonly<{
  id: string;
  currentNodeIndex: number;
  direction: 1 | -1;
}>;

export type GameSnapshot = Readonly<{
  player: Cell;
  blocks: readonly PositionedEntity<BlockDefinition>[];
  goals: readonly PositionedEntity<GoalDefinition>[];
  gates: readonly PositionedEntity<GateDefinition>[];
  spikes: readonly PositionedEntity<SpikeDefinition>[];
  paths: readonly PathState[];
  moves: number;
  remainingSeconds?: number;
}>;

export type GameState = GameSnapshot &
  Readonly<{
    level: LevelDefinition;
    status: GameStatus;
    history: readonly GameSnapshot[];
  }>;

export type GateTraversal = Readonly<{
  direction: Direction;
  from: Cell;
  entry: Cell;
  exit: Cell;
  to: Cell;
}>;

export type MoveResult = Readonly<{
  state: GameState;
  didMove: boolean;
  event?: string;
  gateTraversal?: GateTraversal;
}>;
