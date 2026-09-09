import type { Direction, GameState, LevelDefinition } from '../engine/types';

export const ROUTE_STORAGE_KEY = 'oshi.playtest.routes.v1';
type Source = 'manual' | 'demo';
export type RouteAction = { source: Source } & (
  | { type: 'move'; direction: Direction; outcome: 'moved' | 'blocked' | 'input-locked' }
  | { type: 'undo' | 'restart' | 'demo-start' | 'demo-end' }
);
type RecordedState = Omit<GameState, 'level' | 'history' | 'remainingSeconds'>;
type RouteSession = {
  id: string;
  context: string;
  board: LevelDefinition;
  initial: RecordedState;
  /** UTC Unix milliseconds; absent in legacy exports, never backfilled. */
  entries: { action: RouteAction; state: RecordedState; timestampMs?: number }[];
};
type Archive = { version: 1; generation?: string; sessions: RouteSession[] };

function snapshot(state: GameState): RecordedState {
  const { level: _level, history: _history, remainingSeconds: _seconds, ...rest } = state;
  return rest;
}

/** Append-only input history: Undo affects the board, never erases evidence. No network. */
export class RouteRecorder {
  private archive: Archive = { version: 1, sessions: [] };
  private active?: RouteSession;
  private unreadable = false;
  private dirty = new Set<string>();
  saved = true;

  constructor(
    private readonly storage: Pick<Storage, 'getItem' | 'setItem'>,
    private readonly now: () => number = () => Date.now(),
  ) {
    try {
      const raw = storage.getItem(ROUTE_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Archive;
        if (data.version !== 1 || !Array.isArray(data.sessions) ||
          !data.sessions.every(session => session.board && session.initial && Array.isArray(session.entries))) {
          throw new Error('Unsupported route archive');
        }
        this.archive = data;
      }
    } catch {
      // Keep the old bytes untouched; new records remain exportable in memory.
      this.unreadable = true;
      this.saved = false;
    }
  }

  begin(context: string, state: GameState): void {
    this.syncClear();
    this.active = { id: crypto.randomUUID(), context, board: state.level, initial: snapshot(state), entries: [] };
    this.archive.sessions.push(this.active);
    this.dirty.add(this.active.id);
    this.persist();
  }

  end(): void { this.active = undefined; }

  record(action: RouteAction, state: GameState): void {
    const timestampMs = this.now();
    this.syncClear();
    if (!this.active) throw new Error('Begin a route session before recording.');
    if (!this.archive.sessions.includes(this.active)) this.archive.sessions.push(this.active);
    this.active.entries.push({ action, state: snapshot(state), timestampMs });
    this.dirty.add(this.active.id);
    this.persist();
  }

  get isActive(): boolean { return this.active !== undefined; }
  get count(): number { this.syncClear(); return this.archive.sessions.reduce((sum, session) => sum + session.entries.length, 0); }
  export(): string { this.syncClear(); return JSON.stringify(this.archive, null, 2); }

  /** Explicit user deletion; commit storage first so failure preserves exportable evidence. */
  clear(): boolean {
    const empty: Archive = { version: 1, generation: crypto.randomUUID(), sessions: [] };
    try {
      this.storage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(empty));
      this.archive = empty;
      this.active = undefined;
      this.dirty.clear();
      this.unreadable = false;
      this.saved = true;
      return true;
    } catch { this.saved = false; return false; }
  }

  /** A stale tab resumes from its current board, never republishes the deleted history. */
  private syncClear(): void {
    try {
      const raw = this.storage.getItem(ROUTE_STORAGE_KEY);
      if (!raw) return;
      const other = JSON.parse(raw) as Archive;
      if (other.version !== 1 || !Array.isArray(other.sessions) ||
          !other.generation || other.generation === this.archive.generation) return;
      const previous = this.active;
      this.archive = other;
      this.dirty.clear();
      this.active = previous ? {
        ...previous, id: crypto.randomUUID(), entries: [],
        initial: previous.entries.at(-1)?.state ?? previous.initial,
      } : undefined;
      this.unreadable = false;
      this.saved = true;
    } catch { /* Preserve local evidence when storage cannot be read. */ }
  }

  private persist(): void {
    if (this.unreadable) return;
    try {
      const raw = this.storage.getItem(ROUTE_STORAGE_KEY);
      if (raw) {
        const other = JSON.parse(raw) as Archive;
        if (other.version !== 1 || !Array.isArray(other.sessions)) throw new Error('Unsupported archive');
        const merged = new Map(other.sessions.map(session => [session.id, session]));
        for (const session of this.archive.sessions) {
          if (this.dirty.has(session.id) || !merged.has(session.id)) merged.set(session.id, session);
        }
        this.archive = { ...this.archive, sessions: [...merged.values()] };
      }
      this.storage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(this.archive));
      this.dirty.clear();
      this.saved = true;
    } catch { this.saved = false; }
  }
}
