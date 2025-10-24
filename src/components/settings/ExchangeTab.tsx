'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ExchangeTab() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to CEX settings page
    router.push('/cex-settings');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400 light:text-gray-600">Redirecting to CEX Settings...</p>
      </div>
    </div>
  );
}
