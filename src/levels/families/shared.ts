import type { Cell } from '../../engine/types';

export const cell = (x: number, y: number): Cell => ({ x, y });
export const oneCell = [cell(0, 0)] as const;
