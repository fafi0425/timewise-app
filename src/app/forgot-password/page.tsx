'use client';
import { KeyRound } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block" aria-label="Go to landing page">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md card-shadow transition-transform hover:scale-105">
              <KeyRound className="h-12 w-12 text-white" />
            </div>
            <h1 className="font-headline text-4xl font-bold text-white mb-2">Reset Password</h1>
          </Link>
          <p className="text-lg text-foreground">
            Enter your email to receive a password reset link.
          </p>
        </div>
        <ForgotPasswordForm />
        <div className="mt-8 text-center">
          <p className="text-sm text-foreground/80">
            © {new Date().getFullYear()} TimeWise. All rights reserved.
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
