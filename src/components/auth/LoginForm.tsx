
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please enter both email and password.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
        const user = await login(email, password);
        if (user) {
          toast({
            title: 'Login Successful',
            description: `Welcome back, ${user.name}!`,
          });
          // This is the definitive redirect logic
          if (user.role === 'Administrator') {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        } else {
          toast({
            title: 'Login Failed',
            description: 'Invalid email or password. Please try again.',
            variant: 'destructive',
          });
        }
    } catch(error) {
         toast({
            title: 'Login Failed',
            description: 'An unexpected error occurred. Please try again.',
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

        <div>
          <Label
            htmlFor="password"
            className="mb-2 block text-sm font-semibold text-card-foreground"
          >
            Password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            <Input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12 pr-12 py-6 text-base"
              placeholder="Enter your password"
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

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Checkbox id="remember" />
            <Label htmlFor="remember" className="ml-2 text-sm text-card-foreground">
              Remember me
            </Label>
          </div>
          <a href="#" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </a>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-bold py-6 rounded-xl transition-all duration-300 transform hover:scale-105 text-base"
          disabled={loading}
        >
          {loading ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            'Sign In'
          )}
        </Button>
      </form>
      <div className="mt-8 text-center">
        <p className="text-card-foreground/80">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
