'use client';

import { cn } from '@/lib/utils';

export function FloatingShapes() {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full overflow-hidden">
      <div
        className={cn(
          'shape absolute h-32 w-32 rounded-full bg-secondary/10',
          'top-[20%] left-[10%]',
          'animate-float'
        )}
      />
      <div
        className={cn(
          'shape absolute h-24 w-24 rounded-lg bg-primary/10',
          'top-[60%] right-[10%]',
          'animate-float animation-delay-2000'
        )}
      />
      <div
        className={cn(
          'shape absolute h-40 w-40 rounded-full bg-accent/10',
          'bottom-[20%] left-[20%]',
          'animate-float animation-delay-4000'
        )}
      />
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
