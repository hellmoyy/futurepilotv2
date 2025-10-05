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
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-8xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Error
          </h1>
          <h2 className="text-3xl font-bold text-white">Something went wrong</h2>
          <p className="text-gray-400">
            We&apos;re sorry, but something unexpected happened.
          </p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-8 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
