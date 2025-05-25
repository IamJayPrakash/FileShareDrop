import { FileIcon, X } from 'lucide-react';

export default function FileList({
  files,
  onRemove,
  disabled,
}: {
  files: File[];
  onRemove: (idx: number) => void;
  disabled?: boolean;
}) {
  if (!files.length) return null;
  return (
    <div className="flex flex-col w-full max-w-sm gap-2 mx-auto mb-2 overflow-y-auto max-h-40">
      {files.map((file, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted border border-border shadow-sm"
        >
          <div className="flex items-center min-w-0 gap-2">
            <FileIcon className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold truncate max-w-[120px] text-foreground">
              {file.name}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">
              {Math.round(file.size / 1024) > 1024
                ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                : `${Math.round(file.size / 1024)} KB`}
            </span>
          </div>
          <button
            title="Remove file"
            aria-label="Remove file"
            type="button"
            className="text-xs font-medium px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(idx);
            }}
            disabled={disabled}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
