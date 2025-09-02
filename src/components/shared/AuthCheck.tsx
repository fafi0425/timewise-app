'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';

export default function AuthCheck({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
    } else if (adminOnly && user.role !== 'Administrator') {
      router.push('/dashboard');
    }
  }, [user, loading, router, adminOnly]);

  if (loading || !user || (adminOnly && user.role !== 'Administrator')) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  return <>{children}</>;
}
