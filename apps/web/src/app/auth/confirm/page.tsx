'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ConfirmPage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Show success message briefly
      setShowSuccess(true);

      setTimeout(async () => {
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();

          const hasCompletedOnboarding = profile?.onboarding_completed || false;

          if (!hasCompletedOnboarding) {
            router.push('/onboarding');
          } else {
            router.push('/dashboard');
          }
        } else {
          router.push('/');
        }
      }, 2000); // Show success for 2 seconds
    };

    checkUserAndRedirect();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      {showSuccess ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Confirmed!</h2>
          <p className="text-gray-600">Welcome to TheGuide. Redirecting you now...</p>
        </motion.div>
      ) : (
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      )}
    </div>
  );
}