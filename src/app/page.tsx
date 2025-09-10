import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Clock, BarChartBig, Users, CalendarCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AnimatedClock from '@/components/landing/AnimatedClock';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <Card className="bg-white/50 backdrop-blur-md border-primary/20 text-card-foreground card-shadow">
    <CardHeader className="flex flex-row items-center gap-4">
      <div className="bg-primary p-3 rounded-lg">{icon}</div>
      <CardTitle className="text-xl font-headline">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-card-foreground/80">{description}</p>
    </CardContent>
  </Card>
);

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
       <div className="relative z-10 flex flex-col flex-1">
          <header className="px-4 lg:px-6 h-14 flex items-center bg-white/30 backdrop-blur-md border-b border-black/10 sticky top-0 z-50">
            <Link href="/" className="flex items-center justify-center" prefetch={false}>
              <Clock className="h-6 w-6 text-primary" />
              <span className="ml-2 text-lg font-semibold text-primary font-headline">TimeWise</span>
            </Link>
            <nav className="ml-auto flex gap-4 sm:gap-6">
              <Button asChild variant="ghost" className="text-sm font-medium text-primary hover:bg-black/10 hover:text-primary">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/register">Sign Up</Link>
              </Button>
            </nav>
          </header>
          <main className="flex-1">
            <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 text-white overflow-hidden">
              <div className="container px-4 md:px-6">
                <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
                  <div className="flex flex-col justify-center space-y-4">
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline animate-slide-in-from-left animation-delay-200">
                        Effortless Time Tracking for Your Entire Team
                      </h1>
                      <p className="max-w-[600px] text-white/80 md:text-xl animate-slide-in-from-left animation-delay-400">
                        TimeWise provides a simple, yet powerful solution for monitoring employee work, break, and lunch
                        times. Boost productivity and ensure compliance with ease.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 min-[400px]:flex-row animate-slide-in-from-left animation-delay-600">
                      <Button asChild size="lg" variant="secondary">
                        <Link href="/register">Get Started</Link>
                      </Button>
                    </div>
                  </div>
                  <div className="mx-auto flex items-center justify-center lg:order-last">
                    <AnimatedClock />
                  </div>
                </div>
              </div>
            </section>

            <section className="w-full py-12 md:py-24 lg:py-32 text-white">
              <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="space-y-2">
                    <div className="inline-block rounded-lg bg-black/5 px-3 py-1 text-sm text-white">Key Features</div>
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Everything You Need to Succeed</h2>
                    <p className="max-w-[900px] text-white/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                      Our platform is packed with features designed to streamline your workflow and boost your team's productivity.
                    </p>
                  </div>
                </div>
                <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
                  <FeatureCard 
                    icon={<BarChartBig className="h-6 w-6 text-primary-foreground" />}
                    title="Real-Time Tracking"
                    description="Monitor clock-ins, breaks, and lunches as they happen with a live dashboard."
                  />
                  <FeatureCard 
                    icon={<Users className="h-6 w-6 text-primary-foreground" />}
                    title="Shift Management"
                    description="Easily assign and view employees based on their shifts to manage your workforce effectively."
                  />
                   <FeatureCard 
                    icon={<CalendarCheck className="h-6 w-6 text-primary-foreground" />}
                    title="Automated Timesheets"
                    description="Generate accurate timesheets automatically, calculating regular hours, overtime, and lateness."
                  />
                </div>
              </div>
            </section>

          </main>
          <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-black/10 text-white">
            <p className="text-xs text-white/80">&copy; {new Date().getFullYear()} TimeWise. All rights reserved.</p>
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
    </div>
  );
}