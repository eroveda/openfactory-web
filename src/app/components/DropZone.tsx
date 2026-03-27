import { useState, useRef } from "react";
import { Upload, FileText, Image, X, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import type { Attachment, FileType } from "../../lib/api";

const ACCEPTED_TYPES: Record<string, FileType> = {
  "text/plain": "text",
  "text/markdown": "text",
  "text/csv": "text",
  "image/png": "image",
  "image/jpeg": "image",
  "image/gif": "image",
  "image/webp": "image",
};

const MAX_SIZE_MB = 5;

function detectFileType(file: File): FileType | null {
  return ACCEPTED_TYPES[file.type] ?? null;
}

async function readTextContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string ?? "");
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function uploadToStorage(workpackId: string, file: File): Promise<string> {
  const path = `workpacks/${workpackId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from("attachments")
    .upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("attachments").getPublicUrl(path);
  return data.publicUrl;
}

interface DropZoneProps {
  attachments: Attachment[];
  workpackId: string;
  onUpload: (data: {
    fileName: string;
    fileType: FileType;
    storageUrl: string;
    contentText?: string;
  }) => Promise<void>;
  onDelete: (id: string) => void;
}

export function DropZone({ attachments, workpackId, onUpload, onDelete }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    for (const file of Array.from(files)) {
      const fileType = detectFileType(file);
      if (!fileType) {
        setError(`${file.name}: unsupported type. Use .txt, .md, .csv or images.`);
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`${file.name}: exceeds ${MAX_SIZE_MB}MB limit.`);
        continue;
      }

      setUploading(true);
      try {
        const storageUrl = await uploadToStorage(workpackId, file);
        const contentText = fileType === "text" ? await readTextContent(file) : undefined;
        await onUpload({ fileName: file.name, fileType, storageUrl, contentText });
      } catch (e: any) {
        setError(e.message ?? "Upload failed");
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Existing attachments */}
      <AnimatePresence>
        {attachments.map(a => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-3 bg-white border rounded-lg px-3 py-2"
          >
            {a.fileType === "image" ? (
              <Image className="size-4 text-blue-500 flex-shrink-0" />
            ) : (
              <FileText className="size-4 text-green-600 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{a.fileName}</p>
              <p className="text-xs text-slate-400">
                {a.fileType === "image" ? "Image — not processed in pipeline yet" : "Text — feeds into pipeline"}
              </p>
            </div>
            {a.fileType === "image" && (
              <img
                src={a.storageUrl}
                alt={a.fileName}
                className="size-8 rounded object-cover flex-shrink-0"
              />
            )}
            <button
              onClick={() => onDelete(a.id)}
              className="text-slate-300 hover:text-slate-600 flex-shrink-0"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
          dragging ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        {uploading ? (
          <Loader2 className="size-5 text-blue-500 animate-spin" />
        ) : (
          <Upload className="size-5 text-slate-400" />
        )}
        <p className="text-sm text-slate-500 text-center">
          {uploading ? "Uploading…" : "Drop files here or click to browse"}
        </p>
        <p className="text-xs text-slate-400">
          .txt · .md · .csv · images — max {MAX_SIZE_MB}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept=".txt,.md,.csv,image/*"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="text-xs text-red-500 px-1">{error}</p>
      )}
    </div>
  );
}
