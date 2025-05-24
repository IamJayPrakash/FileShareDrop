import { FileIcon, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

type FileMeta = {
  name: string;
  size: number;
  originalSize: number;
  type: string;
};

const CircularProgress = ({
  progress,
  size = 60,
}: {
  progress: number;
  size?: number;
}) => {
  const radius = size / 2 - 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      aria-label={`Progress ${progress}%`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--muted)"
          strokeWidth="5"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--primary)"
          strokeWidth="5"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <span className="absolute text-xs font-semibold text-foreground">
        {Math.round(progress)}%
      </span>
    </div>
  );
};

export default function ProgressList({
  files,
  progress,
  isSender,
  receivedFilesMeta = [],
}: Readonly<{
  files: File[];
  progress: number[];
  isSender: boolean;
  receivedFilesMeta?: FileMeta[];
}>) {
  return (
    <div className="flex flex-col w-full max-w-xs sm:max-w-md gap-3 mx-auto mt-4">
      {files.map((file, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 p-3 border border-muted rounded-lg shadow-sm bg-card hover:shadow-md transition-shadow duration-200"
        >
          <FileIcon className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="truncate max-w-[150px] sm:max-w-[250px] text-sm font-medium text-foreground relative group">
              {isSender
                ? file.name
                : receivedFilesMeta[idx]?.name || `File ${idx + 1}`}
              <span className="absolute hidden group-hover:block bg-muted text-foreground text-xs rounded p-1 z-10 -top-8 left-0 max-w-[200px] truncate">
                {isSender
                  ? file.name
                  : receivedFilesMeta[idx]?.name || `File ${idx + 1}`}
              </span>
            </span>
            <span className="block text-xs text-muted-foreground">
              {isSender
                ? Math.round(file.size / 1024) > 1024
                  ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                  : `${Math.round(file.size / 1024)} KB`
                : receivedFilesMeta[idx]?.originalSize
                  ? Math.round(receivedFilesMeta[idx].originalSize / 1024) >
                    1024
                    ? `${(receivedFilesMeta[idx].originalSize / (1024 * 1024)).toFixed(2)} MB`
                    : `${Math.round(receivedFilesMeta[idx].originalSize / 1024)} KB`
                  : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {progress[idx] === 100 ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <CircularProgress progress={progress[idx] || 0} />
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
