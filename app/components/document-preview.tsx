import { useState } from "react";
import { formatDifference, formatMeasure, type FileAnalysis } from "../lib/measurements";

type Props = { analysis: FileAnalysis; previewUrl: string; onReset: () => void };

export default function DocumentPreview({ analysis, previewUrl, onReset }: Props) {
  const [dpiInput, setDpiInput] = useState("");
  const dpi = Number(dpiInput.replace(",", "."));
  const validDpi = dpiInput.trim() !== "" && Number.isFinite(dpi) && dpi > 0;
  const widthMm = analysis.widthMm ?? (validDpi && analysis.widthPx ? analysis.widthPx / dpi * 25.4 : undefined);
  const heightMm = analysis.heightMm ?? (validDpi && analysis.heightPx ? analysis.heightPx / dpi * 25.4 : undefined);
  const width = widthMm === undefined ? "— mm" : `${formatMeasure(widthMm)} mm`;
  const height = heightMm === undefined ? "— mm" : `${formatMeasure(heightMm)} mm`;
  return <main className="result-screen">
    <button className="reset-button" onClick={onReset}>↺ <span>Reset</span></button>
    <div className="result-heading">
      <span className="eyebrow">ANÁLISIS DE FORMATO</span>
      <p>Proporción: <strong>{formatDifference(analysis.aspectDifferencePercent)}</strong></p>
    </div>
    <div className="drawing-area" style={{ width: `min(100%, calc((100dvh - 240px) * ${analysis.aspectRatio} + 86px))` }}>
      <div className="document-frame" style={{ aspectRatio: analysis.aspectRatio }}>
        {/* A blob URL is created from the selected local file or rendered PDF page. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt={`Vista previa de ${analysis.name}`} />
      </div>
      <div className="vertical-dimension"><span>{height}</span></div>
      <div className="horizontal-dimension"><span>{width}</span></div>
    </div>
    <div className="result-footer">
      {!analysis.physicalSizeReliable && <label className="dpi-control">
        <span>{validDpi ? "Medida calculada con DPI indicado" : "Indica el DPI para calcular los mm"}</span>
        <input type="text" inputMode="decimal" value={dpiInput} onChange={(event) => setDpiInput(event.target.value)} placeholder="DPI" aria-label="Resolución de la imagen en DPI" />
      </label>}
      <span className="file-name" title={analysis.name}>{analysis.name}</span>
    </div>
  </main>;
}
