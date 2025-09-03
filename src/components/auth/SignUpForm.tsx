
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, Eye, EyeOff, LoaderCircle, User as UserIcon, Building } from 'lucide-react';
import Link from 'next/link';
import { addUser } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export default function SignUpForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!name || !email || !password || !department) {
      toast({
        title: 'Error',
        description: 'Please fill all fields.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }
    
    // Default role and department for self-registered users
    const newUser = await addUser({
        name,
        email,
        password,
        department, 
        role: 'Employee'
    });

    if (newUser) {
      toast({
        title: 'Registration Successful',
        description: 'Your account has been created.',
      });
      
      // Automatically log the user in
      const loggedInUser = await login(email, password);
      if(loggedInUser) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }

    } else {
      toast({
        title: 'Registration Failed',
        description: 'An account with this email may already exist.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  return (
    <div className="rounded-3xl bg-card/95 p-8 backdrop-blur-sm card-shadow">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name" className="mb-2 block text-sm font-semibold text-card-foreground">
            Full Name
          </Label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            <Input
              type="text"
              id="name"
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-12 pr-4 py-6 text-base"
              placeholder="Enter your full name"
            />
          </div>
        </div>
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
            <Label htmlFor="department" className="mb-2 block text-sm font-semibold text-card-foreground">
                Department
            </Label>
            <div className="relative">
                <Building className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger className="pl-12 pr-4 py-6 text-base">
                        <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Dealing">Dealing</SelectItem>
                        <SelectItem value="CS/KYC">CS/KYC</SelectItem>
                    </SelectContent>
                </Select>
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
              placeholder="Create a password"
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

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-bold py-6 rounded-xl transition-all duration-300 transform hover:scale-105 text-base"
          disabled={loading}
        >
          {loading ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            'Create Account'
          )}
        </Button>
      </form>
      <div className="mt-8 text-center">
        <p className="text-card-foreground/80">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
