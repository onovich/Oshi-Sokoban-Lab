export interface WaterContact { id: string; x: number; y: number; width: number; height: number }

/** Bottom-anchored hidden base; coordinates are normalized screen coordinates. */
export function contactBase(piece: WaterContact) {
  return { left: piece.x-piece.width/2, right: piece.x+piece.width/2,
    top: piece.y-piece.height/2, bottom: piece.y };
}

/** Discontinuities (teleport/reset) must not impart a board-crossing fluid velocity. */
export function contactVelocity(current: WaterContact, previous: WaterContact | undefined, seconds: number) {
  if (!previous || seconds <= 0 || seconds > .1 ||
    Math.abs(current.x-previous.x)>current.width*.75 ||
    Math.abs(current.y-previous.y)>current.height*.75) return [0,0];
  return [Math.max(-1,Math.min(1,(current.x-previous.x)/seconds)),
    Math.max(-1,Math.min(1,(current.y-previous.y)/seconds))];
}
