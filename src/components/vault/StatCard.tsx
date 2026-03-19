import { Skeleton } from "@/components/ui/Skeleton";
import { AnimatedValue } from "@/components/ui/AnimatedValue";

interface StatCardProps {
  label: string;
  value: string;
  suffix?: string;
  subValue?: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function StatCard({ label, value, suffix, subValue, isLoading, isError, onRetry }: StatCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      {isLoading ? (
        <Skeleton className="h-7 w-24" />
      ) : isError ? (
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold text-gray-500">---</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-lg font-semibold text-white">
            <AnimatedValue value={value} className={suffix ? "mr-1" : undefined} />
            {suffix && <span className="text-sm text-gray-400">{suffix}</span>}
          </p>
          {subValue && (
            <p className="text-xs text-gray-500 mt-0.5">
              <AnimatedValue value={subValue} />
            </p>
          )}
        </>
      )}
    </div>
  );
}
