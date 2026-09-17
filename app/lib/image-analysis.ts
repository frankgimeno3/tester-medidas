import { aspectDifference, TARGET_ASPECT_RATIO, type FileAnalysis } from "./measurements";

function exifDpi(bytes: Uint8Array, start: number, end: number): { x: number; y: number } | undefined {
  if (end - start < 14 || String.fromCharCode(...bytes.slice(start, start + 6)) !== "Exif\0\0") return;
  const tiff = start + 6;
  const little = bytes[tiff] === 0x49 && bytes[tiff + 1] === 0x49;
  if (!little && !(bytes[tiff] === 0x4d && bytes[tiff + 1] === 0x4d)) return;
  const view = new DataView(bytes.buffer);
  const u16 = (offset: number) => view.getUint16(offset, little);
  const u32 = (offset: number) => view.getUint32(offset, little);
  if (u16(tiff + 2) !== 42) return;
  const ifd = tiff + u32(tiff + 4);
  if (ifd + 2 > end) return;
  const count = u16(ifd);
  let x: number | undefined;
  let y: number | undefined;
  let unit = 2;
  for (let index = 0; index < count; index++) {
    const entry = ifd + 2 + index * 12;
    if (entry + 12 > end) break;
    const tag = u16(entry);
    if (tag === 0x0128 && u16(entry + 2) === 3) unit = u16(entry + 8);
    if ((tag === 0x011a || tag === 0x011b) && u16(entry + 2) === 5) {
      const value = tiff + u32(entry + 8);
      if (value + 8 > end) continue;
      const denominator = u32(value + 4);
      if (!denominator) continue;
      if (tag === 0x011a) x = u32(value) / denominator;
      else y = u32(value) / denominator;
    }
  }
  const factor = unit === 2 ? 1 : unit === 3 ? 2.54 : 0;
  return x && y && factor ? { x: x * factor, y: y * factor } : undefined;
}

function readDpi(bytes: Uint8Array, type: string): { x: number; y: number } | undefined {
  const view = new DataView(bytes.buffer);
  if (type === "image/png" && bytes.length >= 33) {
    let offset = 8;
    while (offset + 12 <= bytes.length) {
      const length = view.getUint32(offset);
      if (offset + length + 12 > bytes.length) break;
      const name = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
      if (name === "pHYs" && length === 9 && bytes[offset + 16] === 1)
        return { x: view.getUint32(offset + 8) * 0.0254, y: view.getUint32(offset + 12) * 0.0254 };
      offset += length + 12;
    }
  }
  if (type === "image/jpeg" && bytes.length >= 18) {
    let offset = 2;
    while (offset + 4 < bytes.length && bytes[offset] === 0xff) {
      const marker = bytes[offset + 1];
      if (marker === 0xda || marker === 0xd9) break;
      const length = view.getUint16(offset + 2);
      if (length < 2 || offset + length + 2 > bytes.length) break;
      if (marker === 0xe1) {
        const exif = exifDpi(bytes, offset + 4, offset + length + 2);
        if (exif) return exif;
      }
      if (marker === 0xe0 && length >= 16 && String.fromCharCode(...bytes.slice(offset + 4, offset + 9)) === "JFIF\0") {
        const unit = bytes[offset + 11];
        const factor = unit === 1 ? 1 : unit === 2 ? 2.54 : 0;
        if (factor) return { x: view.getUint16(offset + 12) * factor, y: view.getUint16(offset + 14) * factor };
      }
      offset += length + 2;
    }
  }
}

export async function analyzeImage(file: File): Promise<{ analysis: FileAnalysis; previewUrl: string }> {
  const previewUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = previewUrl;
    await image.decode();
    const widthPx = image.naturalWidth;
    const heightPx = image.naturalHeight;
    if (!widthPx || !heightPx) throw new Error("No se pudieron leer las dimensiones de la imagen.");
    const dpi = readDpi(new Uint8Array(await file.arrayBuffer()), file.type);
    const physicalSizeReliable = Boolean(dpi?.x && dpi?.y);
    const widthMm = physicalSizeReliable ? widthPx / dpi!.x * 25.4 : undefined;
    const heightMm = physicalSizeReliable ? heightPx / dpi!.y * 25.4 : undefined;
    return { previewUrl, analysis: {
      type: "image", name: file.name, widthPx, heightPx, widthMm, heightMm,
      aspectRatio: widthPx / heightPx, targetAspectRatio: TARGET_ASPECT_RATIO,
      aspectDifferencePercent: aspectDifference(widthPx, heightPx), physicalSizeReliable,
    } };
  } catch (error) { URL.revokeObjectURL(previewUrl); throw error; }
}
