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
  entries: { action: RouteAction; state: RecordedState }[];
};
type Archive = { version: 1; sessions: RouteSession[] };

function snapshot(state: GameState): RecordedState {
  const { level: _level, history: _history, remainingSeconds: _seconds, ...rest } = state;
  return rest;
}

/** Append-only input history: Undo affects the board, never erases evidence. No clock or network. */
export class RouteRecorder {
  private archive: Archive = { version: 1, sessions: [] };
  private active?: RouteSession;
  private unreadable = false;
  private dirty = new Set<string>();
  saved = true;

  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem'>) {
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
    this.active = { id: crypto.randomUUID(), context, board: state.level, initial: snapshot(state), entries: [] };
    this.archive.sessions.push(this.active);
    this.dirty.add(this.active.id);
    this.persist();
  }

  end(): void { this.active = undefined; }

  record(action: RouteAction, state: GameState): void {
    if (!this.active) throw new Error('Begin a route session before recording.');
    this.active.entries.push({ action, state: snapshot(state) });
    this.dirty.add(this.active.id);
    this.persist();
  }

  get isActive(): boolean { return this.active !== undefined; }
  get count(): number { return this.archive.sessions.reduce((sum, session) => sum + session.entries.length, 0); }
  export(): string { return JSON.stringify(this.archive, null, 2); }

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
        this.archive = { version: 1, sessions: [...merged.values()] };
      }
      this.storage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(this.archive));
      this.dirty.clear();
      this.saved = true;
    } catch { this.saved = false; }
  }
}
