import React from 'react';
import { cn } from '@/lib/utils';

interface LogoIconProps extends React.SVGProps<SVGSVGElement> {}

const LogoIcon = React.forwardRef<SVGSVGElement, LogoIconProps>(
  ({ className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={cn(className)}
      {...props}
    >
      {/* White Background Circle */}
      <circle cx="100" cy="100" r="100" fill="white" />
      
      {/* Clock Outline */}
      <circle cx="100" cy="100" r="90" stroke="#3282B8" strokeWidth="5" fill="none" />
      
      {/* Clock Ticks */}
      {Array.from({ length: 60 }).map((_, i) => {
        const isHourTick = i % 5 === 0;
        const angle = i * 6;
        const x1 = 100 + (isHourTick ? 80 : 84) * Math.cos((angle - 90) * Math.PI / 180);
        const y1 = 100 + (isHourTick ? 80 : 84) * Math.sin((angle - 90) * Math.PI / 180);
        const x2 = 100 + 88 * Math.cos((angle - 90) * Math.PI / 180);
        const y2 = 100 + 88 * Math.sin((angle - 90) * Math.PI / 180);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#3282B8"
            strokeWidth={isHourTick ? "3" : "1.5"}
          />
        );
      })}
      
      {/* Text part 1: "TIMEW" */}
      <text x="26" y="110" fill="#0F4C75" style={{ fontSize: '28px', fontFamily: 'var(--font-headline, sans-serif)', letterSpacing: '2px' }}>
        TIMEW
      </text>
      
      {/* Fork/Tie Icon for "I" */}
      <g transform="translate(108, 80) scale(1.4)">
        {/* Tie part */}
        <path fill="#2E8B57" d="M0.5,10 L3,14 L-2,14 z" /> 
        <path fill="#2E8B57" d="M-0.5,0 L-0.5,10 L1.5,10 L1.5,0 z" transform="translate(-0.5,0)" />
        {/* Fork part */}
        <path stroke="#0F4C75" strokeWidth="0.8" fill="none" d="M-2,0 C-2,-3 0.5,-4 0.5,-4 C0.5,-4 3,-3 3,0" />
      </g>
      
      {/* Text part 2: "SE" */}
       <text x="127" y="110" fill="#0F4C75" style={{ fontSize: '28px', fontFamily: 'var(--font-headline, sans-serif)', letterSpacing: '2px' }}>
        SE
      </text>

    </svg>
  )
);

LogoIcon.displayName = 'LogoIcon';

export default LogoIcon;
