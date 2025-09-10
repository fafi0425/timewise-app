import React from 'react';
import { cn } from '@/lib/utils';

interface LogoIconProps extends React.SVGProps<SVGSVGElement> {}

const LogoIcon = React.forwardRef<SVGSVGElement, LogoIconProps>(
  ({ className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
      {...props}
    >
      <defs>
        <g id="fork">
          <path d="M5 12h14" />
          <path d="M6 12V2a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v10" />
          <path d="M14 12V2a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v10" />
        </g>
        <g id="tie">
           <path d="M12 13l-2 7 4 0 -2 -7Z" fill="hsl(var(--secondary))" stroke="none" />
        </g>
      </defs>
      <use href="#fork" />
      <use href="#tie" />
    </svg>
  )
);

LogoIcon.displayName = 'LogoIcon';

export default LogoIcon;
