// filepath: construction-calc/src/types/index.ts

export interface WallPreviewProps {
  length: number;
  width: number;
  height: number;
  doors: { x: number; y: number; width: number; height: number }[];
  windows: { x: number; y: number; width: number; height: number }[];
  updateDoor: (index: number, door: { x: number; y: number; width: number; height: number }) => void;
  updateWindow: (index: number, window: { x: number; y: number; width: number; height: number }) => void;
}

export type MaterialType = 'stud' | 'beam' | 'plate' | 'joist' | 'wall' | 'window' | 'door';

export interface LumberPiece {
  position: Vector3;
  rotation: Vector3;
  dimensions: Vector3;
  type: MaterialType;
  id: string;
}