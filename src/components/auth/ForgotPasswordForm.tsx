'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, LoaderCircle } from 'lucide-react';
import { sendPasswordReset } from '@/lib/auth';
import Link from 'next/link';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
        await sendPasswordReset(email);
        toast({
            title: 'Check Your Email',
            description: 'If an account with that email exists, a password reset link has been sent.',
        });
        router.push('/login');
    } catch(error: any) {
         toast({
            title: 'Error',
            description: error.message || 'An unexpected error occurred. Please try again.',
            variant: 'destructive',
          });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-card/95 p-8 backdrop-blur-sm card-shadow">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="email" className="mb-2 block text-sm font-semibold text-card-foreground">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            <Input
              type="email"
              id="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-12 pr-4 py-6 text-base"
              placeholder="Enter your email address"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-bold py-6 rounded-xl transition-all duration-300 transform hover:scale-105 text-base"
          disabled={loading}
        >
          {loading ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            'Send Reset Link'
          )}
        </Button>
      </form>
      <div className="mt-8 text-center">
        <p className="text-card-foreground/80">
          Remember your password?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
