'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardNav from '@/components/DashboardNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black dark:from-black dark:via-gray-900 dark:to-black light:from-gray-50 light:via-gray-100 light:to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 dark:text-gray-400 light:text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black dark:from-black dark:via-gray-900 dark:to-black light:from-gray-50 light:via-gray-100 light:to-gray-50">
      <Sidebar />
      <DashboardNav />
      <div className="ml-64 pt-24">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
