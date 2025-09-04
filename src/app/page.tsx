
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Clock className="h-6 w-6 text-white" />
          <span className="ml-2 text-lg font-semibold text-white font-headline">TimeWise</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button asChild variant="ghost" className="text-sm font-medium text-white hover:underline underline-offset-4">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild className="text-sm font-medium">
            <Link href="/register">Sign Up</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 text-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    Effortless Time Tracking for Your Entire Team
                  </h1>
                  <p className="max-w-[600px] text-foreground md:text-xl">
                    TimeWise provides a simple, yet powerful solution for monitoring employee work, break, and lunch
                    times. Boost productivity and ensure compliance with ease.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/register">Get Started</Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://picsum.photos/600/400"
                width="600"
                height="400"
                alt="Hero"
                data-ai-hint="work time management"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
              />
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-white/20 text-white">
        <p className="text-xs text-foreground/80">&copy; {new Date().getFullYear()} TimeWise. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
