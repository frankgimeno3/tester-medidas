export const TARGET_ASPECT_RATIO = 228 / 297;
export type Box = [number, number, number, number];
export type FileAnalysis = {
  type: "pdf" | "image";
  name: string;
  widthPx?: number;
  heightPx?: number;
  widthMm?: number;
  heightMm?: number;
  aspectRatio: number;
  targetAspectRatio: number;
  aspectDifferencePercent: number;
  physicalSizeReliable: boolean;
  pdfBoxes?: { visibleBox: Box; mediaBox?: Box; cropBox?: Box; trimBox?: Box; bleedBox?: Box };
  canvasSizeMm?: { width: number; height: number };
  trimSizeMm?: { width: number; height: number };
  bleedSizeMm?: { width: number; height: number };
  detectedMarks?: unknown;
};
export const aspectDifference = (width: number, height: number) => ((width / height) / TARGET_ASPECT_RATIO - 1) * 100;
export const pointsToMm = (points: number) => points * 25.4 / 72;
export const formatMeasure = (value: number) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(value);
export function formatDifference(value: number) {
  if (Math.abs(value) < 0.005) return "exacta";
  return `${value > 0 ? "+" : ""}${new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} %`;
}
