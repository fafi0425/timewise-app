
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { resetPassword, verifyResetCode } from '@/lib/auth';
import Link from 'next/link';

function ResetPasswordFormComponent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');
  const { toast } = useToast();

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setError("Invalid or missing password reset code. Please request a new link.");
        setVerifying(false);
        return;
      }
      try {
        await verifyResetCode(oobCode);
        setVerifying(false);
      } catch (e: any) {
        setError(e.message || "The password reset link is invalid or has expired. Please try again.");
        setVerifying(false);
      }
    };
    verifyCode();
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: 'destructive' });
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters long.", variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (!oobCode) {
        toast({ title: "Error", description: "Invalid password reset code.", variant: 'destructive' });
        setLoading(false);
        return;
    }

    try {
        await resetPassword(oobCode, password);
        toast({ title: "Success", description: "Your password has been reset. You can now sign in." });
        router.push('/login');
    } catch (e: any) {
        toast({ title: "Error", description: e.message || "Failed to reset password.", variant: 'destructive' });
    } finally {
        setLoading(false);
    }
  };
  
  if (verifying) {
    return (
        <div className="rounded-3xl bg-card/95 p-8 backdrop-blur-sm card-shadow text-center">
            <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-card-foreground">Verifying your link...</p>
        </div>
    );
  }
  
  if (error) {
      return (
        <div className="rounded-3xl bg-card/95 p-8 backdrop-blur-sm card-shadow text-center">
            <p className="text-destructive">{error}</p>
            <Button asChild className="mt-4">
                <Link href="/forgot-password">Request a new link</Link>
            </Button>
        </div>
      );
  }

  return (
    <div className="rounded-3xl bg-card/95 p-8 backdrop-blur-sm card-shadow">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-card-foreground">
            New Password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            <Input
              type={showPassword ? 'text' : 'password'}
              id="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12 pr-12 py-6 text-base"
              placeholder="Enter your new password"
            />
             <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 text-primary hover:bg-primary/10"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-card-foreground">
            Confirm Password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirm-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-12 pr-12 py-6 text-base"
              placeholder="Confirm your new password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 text-primary hover:bg-primary/10"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-bold py-6 rounded-xl transition-all duration-300 transform hover:scale-105 text-base"
          disabled={loading}
        >
          {loading ? <LoaderCircle className="animate-spin" /> : 'Reset'}
        </Button>
      </form>
    </div>
  );
}

// Wrap the component in Suspense to handle useSearchParams
export default function ResetPasswordForm() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordFormComponent />
        </Suspense>
    )
}
