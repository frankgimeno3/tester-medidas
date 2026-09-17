import { formatDifference, formatMeasure, type FileAnalysis } from "../lib/measurements";

type Props = { analysis: FileAnalysis; previewUrl: string; onReset: () => void };

export default function DocumentPreview({ analysis, previewUrl, onReset }: Props) {
  const width = analysis.widthMm === undefined ? `${analysis.widthPx} px` : `${formatMeasure(analysis.widthMm)} mm`;
  const height = analysis.heightMm === undefined ? `${analysis.heightPx} px` : `${formatMeasure(analysis.heightMm)} mm`;
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
      {!analysis.physicalSizeReliable && <span>Tamaño físico no disponible · sin DPI fiable</span>}
      <span className="file-name" title={analysis.name}>{analysis.name}</span>
    </div>
  </main>;
}
