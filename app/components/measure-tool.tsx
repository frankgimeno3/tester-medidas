"use client";

import { useEffect, useRef, useState } from "react";
import FileUpload from "./file-upload";
import DocumentPreview from "./document-preview";
import type { FileAnalysis } from "../lib/measurements";

type Result = { analysis: FileAnalysis; previewUrl: string };
const allowed = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export default function MeasureTool() {
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const currentUrl = useRef<string | null>(null);

  useEffect(() => () => { generation.current++; if (currentUrl.current) URL.revokeObjectURL(currentUrl.current); }, []);

  async function onFile(file: File) {
    if (!allowed.has(file.type)) { setError("Selecciona un PDF, JPG, PNG o WEBP válido."); return; }
    const request = ++generation.current;
    setBusy(true);
    setError(null);
    try {
      const next = file.type === "application/pdf"
        ? await import("../lib/pdf-analysis").then(({ analyzePdf }) => analyzePdf(file))
        : await import("../lib/image-analysis").then(({ analyzeImage }) => analyzeImage(file));
      if (request !== generation.current) { URL.revokeObjectURL(next.previewUrl); return; }
      currentUrl.current = next.previewUrl;
      setResult(next);
    } catch { if (request === generation.current) setError("No se pudo leer el archivo. Comprueba que no esté dañado."); }
    finally { if (request === generation.current) setBusy(false); }
  }

  function reset() {
    generation.current++;
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    currentUrl.current = null;
    setResult(null);
    setBusy(false);
    setError(null);
  }

  return result ? <DocumentPreview analysis={result.analysis} previewUrl={result.previewUrl} onReset={reset} />
    : <FileUpload onFile={onFile} busy={busy} error={error} />;
}
