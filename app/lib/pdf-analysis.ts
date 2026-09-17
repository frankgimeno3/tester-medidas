import { aspectDifference, pointsToMm, TARGET_ASPECT_RATIO, type Box, type FileAnalysis } from "./measurements";

export async function analyzePdf(file: File): Promise<{ analysis: FileAnalysis; previewUrl: string }> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await task.promise;
  try {
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const widthMm = pointsToMm(viewport.width);
    const heightMm = pointsToMm(viewport.height);
    const scale = Math.min(2, 2400 / Math.max(viewport.width, viewport.height));
    const renderViewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(renderViewport.width));
    canvas.height = Math.max(1, Math.round(renderViewport.height));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo crear la vista previa del PDF.");
    await page.render({ canvasContext: context, viewport: renderViewport }).promise;
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("No se pudo crear la vista previa.")), "image/png"));
    const previewUrl = URL.createObjectURL(blob);
    const visibleBox = page.view as Box;
    page.cleanup();
    return { previewUrl, analysis: {
      type: "pdf", name: file.name, widthMm, heightMm,
      aspectRatio: widthMm / heightMm, targetAspectRatio: TARGET_ASPECT_RATIO,
      aspectDifferencePercent: aspectDifference(widthMm, heightMm), physicalSizeReliable: true,
      pdfBoxes: { visibleBox }, canvasSizeMm: { width: widthMm, height: heightMm },
    } };
  } finally { await pdf.destroy(); }
}
