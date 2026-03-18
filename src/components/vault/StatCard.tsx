import { Skeleton } from "@/components/ui/Skeleton";
import { AnimatedValue } from "@/components/ui/AnimatedValue";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  isLoading?: boolean;
  isError?: boolean;
}

export function StatCard({ label, value, subValue, isLoading, isError }: StatCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      {isLoading ? (
        <Skeleton className="h-7 w-24" />
      ) : isError ? (
        <p className="text-lg font-semibold text-gray-500">---</p>
      ) : (
        <>
          <p className="text-lg font-semibold text-white">
            <AnimatedValue value={value} />
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
