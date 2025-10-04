
export interface CanvasSize {
  width: number;
  height: number;
  aspectRatio: string;
}

export enum CanvasItemType {
  TEXT = 'text',
  IMAGE = 'image',
}

export interface CanvasItem {
  id: string;
  type: CanvasItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content: string;
  fontSize?: number;
  color?: string;
}
