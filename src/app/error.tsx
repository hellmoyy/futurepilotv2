'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-8xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Oops!
          </h1>
          <h2 className="text-3xl font-bold text-white">Something went wrong</h2>
          <p className="text-gray-400">
            We&apos;re sorry, but something unexpected happened. Please try again.
          </p>
        </div>
        
        <button
          onClick={reset}
          className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
