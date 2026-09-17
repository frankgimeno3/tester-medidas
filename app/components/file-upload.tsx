type Props = { onFile: (file: File) => void; busy: boolean; error: string | null };

export default function FileUpload({ onFile, busy, error }: Props) {
  return <main className="upload-screen">
    <div className="upload-content">
      <span className="eyebrow">CONTROL DE FORMATO · 228 × 297 MM</span>
      <h1>Comprueba tu archivo<br />para impresión.</h1>
      <p>Sube un PDF o una imagen para ver sus medidas y proporción.</p>
      <label className="upload-button">
        {busy ? "Analizando…" : "Seleccionar archivo"}
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }} />
      </label>
      <span className="file-hint">PDF · JPG · PNG · WEBP</span>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  </main>;
}
