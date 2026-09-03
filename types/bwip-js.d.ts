declare module "bwip-js" {
  export interface ToCanvasOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    includetext?: boolean;
    textxalign?: "left" | "center" | "right" | "justify";
  }

  export function toCanvas(
    canvas: HTMLCanvasElement,
    options: ToCanvasOptions,
  ): HTMLCanvasElement;
}
