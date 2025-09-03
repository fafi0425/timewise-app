
'use client';
import { Clock } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <AuthLayout>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md card-shadow">
            <Clock className="h-12 w-12 text-white" />
          </div>
          <h1 className="font-headline text-4xl font-bold text-white mb-2">Time Tracker</h1>
          <p className="text-lg text-foreground">
            Welcome To Terra Services & Technology Inc! Please sign in to continue.
          </p>
        </div>
        <LoginForm />
        <div className="mt-8 text-center">
          <p className="text-sm text-foreground/80">
            © {new Date().getFullYear()} Time Tracker. All rights reserved.
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
