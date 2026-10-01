interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Something went wrong loading this content.", onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-card border border-graphite bg-carbon-card p-24 text-center">
      <p className="text-body-sm text-ash-gray">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-12 text-body-sm font-medium text-ghost-white underline underline-offset-4"
        >
          Try again
        </button>
      )}
    </div>
  );
}
