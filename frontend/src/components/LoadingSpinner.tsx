export default function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-xl">!</div>
      <p className="text-gray-600">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-brand-500 underline text-sm hover:no-underline">
          Try again
        </button>
      )}
    </div>
  );
}
