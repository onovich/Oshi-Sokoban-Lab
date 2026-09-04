import type { Direction, GameState } from '../engine/types';

type GameControlsProps = Readonly<{
  state: GameState;
  onMove: (direction: Direction) => void;
  onNext?: () => void;
  onRestart: () => void;
  onUndo: () => void;
  onDemonstrate?: () => void;
  nextLessonTitle?: string;
  movementDisabled?: boolean;
}>;

export function GameControls({
  movementDisabled = false,
  state,
  onMove,
  onNext,
  onRestart,
  onUndo,
  onDemonstrate,
  nextLessonTitle,
}: GameControlsProps) {
  return (
    <section aria-label="Puzzle controls" className="controls">
      <div className="controls__actions">
        <button disabled={state.history.length === 0} onClick={onUndo} type="button">
          Undo <kbd>Z</kbd>
        </button>
        <button onClick={onRestart} type="button">
          Restart <kbd>R</kbd>
        </button>
        {onDemonstrate ? (
          <button disabled={movementDisabled} id="solution-demo-trigger" onClick={onDemonstrate} type="button">
            演示解法
          </button>
        ) : null}
        {onNext && nextLessonTitle ? (
          <button className="controls__next" onClick={onNext} type="button">
            下一关
          </button>
        ) : null}
      </div>
      <div aria-label="Move controls" className="controls__pad">
        <button aria-label="Move up" disabled={movementDisabled} onClick={() => onMove('up')} type="button">
          ↑
        </button>
        <button aria-label="Move left" disabled={movementDisabled} onClick={() => onMove('left')} type="button">
          ←
        </button>
        <button aria-label="Move down" disabled={movementDisabled} onClick={() => onMove('down')} type="button">
          ↓
        </button>
        <button aria-label="Move right" disabled={movementDisabled} onClick={() => onMove('right')} type="button">
          →
        </button>
      </div>
    </section>
  );
}
