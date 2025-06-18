"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'loading') {
      if (session?.user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [session, status, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="space-y-4 p-8 rounded-lg shadow-xl bg-card">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
