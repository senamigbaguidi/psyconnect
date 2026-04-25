import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X, FileText, Image as ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type FileUploadStatus = "idle" | "compressing" | "ready" | "uploading" | "done" | "error";

interface FileUploadProps {
  id?: string;
  accept?: string;
  maxSizeMB?: number;
  /** Compress images down to this max width (px). 0 = no compression */
  imageMaxWidth?: number;
  /** JPEG quality 0-1 */
  imageQuality?: number;
  required?: boolean;
  label?: string;
  helper?: string;
  status?: FileUploadStatus;
  progress?: number; // 0-100
  errorMessage?: string;
  onFileChange: (file: File | null) => void;
}

/** Compress an image file client-side using canvas. Returns original file if not an image or if compression fails. */
async function compressImage(file: File, maxWidth: number, quality: number): Promise<File> {
  if (!file.type.startsWith("image/") || maxWidth <= 0) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, maxWidth / bitmap.width);
    const w = Math.round(bitmap.width * ratio);
    const h = Math.round(bitmap.height * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob(res, "image/jpeg", quality),
    );
    if (!blob) return file;
    // Only keep compressed if smaller
    if (blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function FileUpload({
  id = "file-upload",
  accept = "application/pdf,image/*",
  maxSizeMB = 8,
  imageMaxWidth = 1600,
  imageQuality = 0.82,
  required,
  label = "Téléverser un fichier",
  helper = "PDF ou image, jusqu'à 8 Mo",
  status = "idle",
  progress = 0,
  errorMessage,
  onFileChange,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [internalStatus, setInternalStatus] = useState<FileUploadStatus>("idle");
  const [internalError, setInternalError] = useState<string | null>(null);

  // External status overrides internal one for upload phases
  const effectiveStatus: FileUploadStatus =
    status === "idle" || status === "ready" ? internalStatus : status;
  const effectiveError = errorMessage ?? internalError;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handle = useCallback(
    async (raw: File | null) => {
      setInternalError(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      if (!raw) {
        setFile(null);
        setOriginalSize(null);
        setInternalStatus("idle");
        onFileChange(null);
        return;
      }
      if (raw.size > maxSizeMB * 1024 * 1024) {
        setInternalStatus("error");
        setInternalError(`Fichier trop lourd (max ${maxSizeMB} Mo).`);
        onFileChange(null);
        return;
      }
      setOriginalSize(raw.size);
      setInternalStatus("compressing");
      const processed = raw.type.startsWith("image/")
        ? await compressImage(raw, imageMaxWidth, imageQuality)
        : raw;
      setFile(processed);
      if (processed.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(processed));
      }
      setInternalStatus("ready");
      onFileChange(processed);
    },
    [imageMaxWidth, imageQuality, maxSizeMB, onFileChange, previewUrl],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    handle(f);
  };

  const clear = () => {
    handle(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const isImage = file?.type.startsWith("image/");
  const compressed =
    file && originalSize && file.size < originalSize
      ? Math.round((1 - file.size / originalSize) * 100)
      : 0;

  return (
    <div className="space-y-2">
      {!file && (
        <label
          htmlFor={id}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className={cn(
            "group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 p-6 text-sm transition-colors",
            "hover:border-primary/50 hover:bg-muted",
            "focus-within:border-primary focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-105">
            <Upload className="h-5 w-5" aria-hidden />
          </span>
          <span className="font-medium text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">{helper}</span>
          <span className="text-xs text-muted-foreground">
            Glissez-déposez ou cliquez pour choisir
          </span>
        </label>
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        required={required && !file}
        className="sr-only"
        aria-describedby={`${id}-status`}
        onChange={(e) => handle(e.target.files?.[0] ?? null)}
      />

      {file && (
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-start gap-3">
            {isImage && previewUrl ? (
              <img
                src={previewUrl}
                alt="Aperçu du fichier"
                className="h-16 w-16 flex-none rounded-lg object-cover ring-1 ring-border"
              />
            ) : (
              <div className="flex h-16 w-16 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-border">
                {isImage ? <ImageIcon className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(file.size)}
                {compressed > 0 && (
                  <span className="ml-1 text-secondary">· optimisé −{compressed}%</span>
                )}
              </p>
              <div id={`${id}-status`} className="mt-2" aria-live="polite">
                {effectiveStatus === "compressing" && (
                  <p className="text-xs text-muted-foreground">Optimisation…</p>
                )}
                {effectiveStatus === "ready" && (
                  <p className="flex items-center gap-1 text-xs text-secondary">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Prêt à envoyer
                  </p>
                )}
                {effectiveStatus === "uploading" && (
                  <div className="space-y-1">
                    <Progress value={progress} aria-label="Progression de l'envoi" />
                    <p className="text-xs text-muted-foreground">
                      Envoi… {Math.round(progress)}%
                    </p>
                  </div>
                )}
                {effectiveStatus === "done" && (
                  <p className="flex items-center gap-1 text-xs text-secondary">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Envoyé
                  </p>
                )}
                {effectiveStatus === "error" && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {effectiveError ?? "Une erreur est survenue."}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={clear}
              disabled={effectiveStatus === "uploading"}
              aria-label="Retirer le fichier"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-40"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}