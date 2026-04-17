"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <h2 className="text-lg font-semibold text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Failed to load vault data. This is usually temporary.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
