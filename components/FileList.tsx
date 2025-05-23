import { FileIcon } from 'lucide-react';

export default function FileList({
  files,
  onRemove,
  disabled,
}: {
  files: File[];
  onRemove: (idx: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col w-full max-w-xs gap-2 mx-auto mb-2 overflow-y-auto max-h-40">
      {files.map((file, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-muted"
        >
          <div className="flex items-center min-w-0 gap-2">
            <FileIcon className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium truncate max-w-[90px]">
              {file.name}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">
              {Math.round(file.size / 1024) > 1024
                ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                : `${Math.round(file.size / 1024)} KB`}
            </span>
          </div>
          <button
            type="button"
            className="text-xs underline text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(idx);
            }}
            disabled={disabled}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
