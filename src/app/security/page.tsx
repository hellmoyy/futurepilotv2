'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Security page redirect
 * This page has been moved to Settings > Security tab
 * Automatically redirects users to /settings?tab=security
 */
export default function SecurityRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the Security tab in Settings
    router.replace('/settings?tab=security');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting to Settings...</p>
      </div>
    </div>
  );
}
