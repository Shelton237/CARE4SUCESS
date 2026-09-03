import { useState } from "react";
import { FileText, File, Download, Maximize2, X, ExternalLink } from "lucide-react";

interface FilePreviewProps {
  url: string;
  label?: string;
  className?: string;
}

function getFileType(url: string): "image" | "pdf" | "other" {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  return "other";
}

function getFileName(url: string): string {
  try {
    return decodeURIComponent(url.split("?")[0].split("/").pop() || "fichier");
  } catch {
    return "fichier";
  }
}

export function FilePreview({ url, label, className = "" }: FilePreviewProps) {
  const [lightbox, setLightbox] = useState(false);
  const fileType = getFileType(url);
  const fileName = getFileName(url);

  if (fileType === "image") {
    return (
      <>
        <div className={`space-y-2 ${className}`}>
          <div
            className="relative group cursor-pointer border border-slate-100 bg-slate-50 overflow-hidden"
            onClick={() => setLightbox(true)}
          >
            <img
              src={url}
              alt={label || fileName}
              className="w-full max-h-56 object-contain"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-[#0D2D5A] flex items-center gap-1.5 shadow">
                <Maximize2 className="w-3 h-3" /> Agrandir
              </div>
            </div>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-black text-[#1A6CC8] uppercase tracking-widest flex items-center gap-1 hover:underline"
          >
            <ExternalLink className="w-3 h-3" /> Ouvrir dans un nouvel onglet
          </a>
        </div>

        {lightbox && (
          <div
            className="fixed inset-0 z-[200] bg-black/85 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <button
              className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2 hover:bg-black/60 transition-all"
              onClick={() => setLightbox(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={url}
              alt={label || fileName}
              className="max-w-full max-h-[90vh] object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  if (fileType === "pdf") {
    return (
      <div className={`flex items-center gap-3 bg-orange-50/50 border border-orange-100 p-3 ${className}`}>
        <div className="w-10 h-10 bg-orange-100 flex items-center justify-center text-orange-500 flex-shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Document PDF</p>
          <p className="text-[10px] font-black text-[#0D2D5A] truncate" title={fileName}>{fileName}</p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 flex items-center gap-1 transition-all"
        >
          <ExternalLink className="w-3 h-3" /> Ouvrir
        </a>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 bg-slate-50 border border-slate-100 p-3 ${className}`}>
      <div className="w-10 h-10 bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
        <File className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Fichier joint</p>
        <p className="text-[10px] font-black text-[#0D2D5A] truncate" title={fileName}>{fileName}</p>
      </div>
      <a
        href={url}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 bg-[#1A6CC8] hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 flex items-center gap-1 transition-all"
      >
        <Download className="w-3 h-3" /> Télécharger
      </a>
    </div>
  );
}
