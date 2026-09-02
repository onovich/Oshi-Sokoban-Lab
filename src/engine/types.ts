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

/** Curriculum role names describe what the board does, rather than its difficulty. */
export type LessonRole = 'establish' | 'boundary' | 'inference';

export type LevelTheorem = Readonly<{
  /** Source-audited engine rules the lesson is allowed to rely on. */
  axioms: readonly string[];
  /** Internal design proposition. This text is never rendered to players. */
  proposition: string;
  /** Observable events/state predicates that every valid solution must use. */
  requiredPredicates: readonly string[];
  /** Predicate after which post-insight execution is measured. */
  criticalEvent: string;
  /** The single causal variable changed by a boundary lesson. */
  contrastVariable?: string;
  /** Elements kept only to make a contrast or board boundary statically legible. */
  readabilityElements?: readonly string[];
}>;

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

/**
 * Curriculum metadata wraps the engine board so authored teaching intent never
 * leaks into the deterministic game state or presentation by accident.
 */
export type LevelSpec = Readonly<{
  id: string;
  groupId: string;
  role: LessonRole;
  prerequisites: readonly string[];
  board: LevelDefinition;
  theorem: LevelTheorem;
}>;

export type CourseGroupDefinition = Readonly<{
  id: string;
  title: string;
  branch: 'foundation' | 'shape' | 'fake' | 'spike' | 'goal' | 'rain' | 'gate' | 'combination';
  prerequisites: readonly string[];
  completionPrerequisites?: readonly string[];
  levelIds: readonly [string, string, string];
}>;

export type LevelAnalysis = Readonly<{
  solvable: boolean;
  optimalMoves: number;
  optimalPushes: number;
  insightTailPushes: number;
  bypassExists: boolean;
  proofCriticalElements: readonly string[];
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

export type DomainEvent =
  | Readonly<{
      type: 'block-pushed';
      entityId: string;
      from: Cell;
      to: Cell;
    }>
  | Readonly<{
      type: 'goal-pushed';
      entityId: string;
      from: Cell;
      to: Cell;
    }>
  | Readonly<{
      type: 'goal-crossed';
      entityId: string;
      at: Cell;
    }>
  | Readonly<{
      type: 'gate-pushed';
      entityId: string;
      from: Cell;
      to: Cell;
    }>
  | (GateTraversal & Readonly<{
      type: 'gate-traversed';
      entryGateId: string;
      exitGateId: string;
    }>)
  | Readonly<{
      type: 'rain-slid';
      direction: Direction;
      from: Cell;
      to: Cell;
    }>
  | Readonly<{
      type: 'object-reset';
      entityType: 'block' | 'goal' | 'gate';
      entityId: string;
      reason: 'spike';
      from: Cell;
      to: Cell;
      contactCells: readonly Cell[];
    }>
  | Readonly<{
      type: 'death-reset';
      reason: 'spike';
    }>;

export type MoveResult = Readonly<{
  state: GameState;
  didMove: boolean;
  events: readonly DomainEvent[];
  event?: string;
  gateTraversal?: GateTraversal;
}>;
