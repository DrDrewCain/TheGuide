'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    // TODO: Check if user needs onboarding or has resources
    // For now, redirect to onboarding (to be implemented)
    router.push('/onboarding');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );
}