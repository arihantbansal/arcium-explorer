"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-semibold text-text-primary">
        Something went wrong
      </h2>
      <p className="max-w-md text-sm text-text-muted">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "An unexpected error occurred while loading this page."}
      </p>
      <button
        onClick={reset}
        className="rounded-md border border-border-muted bg-bg-elevated px-4 py-2 text-sm text-text-primary transition-colors hover:bg-border-primary"
      >
        Try again
      </button>
    </div>
  );
}
