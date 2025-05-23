import { Progress } from '@/components/ui/progress';

export default function ProgressList({
  files,
  progress,
  isSender,
}: {
  files: File[];
  progress: number[];
  isSender: boolean;
}) {
  return (
    <div className="flex flex-col w-full max-w-xs gap-2 mx-auto mt-4 sm:max-w-full">
      {files.map((file, idx) => (
        <div key={idx} className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="truncate max-w-[120px] sm:max-w-[200px]">
              {isSender ? file.name : `Receiving ${idx + 1}`}
            </span>
            <span>{progress[idx] || 0}%</span>
          </div>
          <Progress value={progress[idx] || 0} className="h-2" />
        </div>
      ))}
    </div>
  );
}
