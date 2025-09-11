
import React from 'react';
import { cn } from '@/lib/utils';

interface LogoIconProps extends React.SVGProps<SVGSVGElement> {}

const LogoIcon = React.forwardRef<SVGSVGElement, LogoIconProps>(
  ({ className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50" // Adjusted viewBox for a more horizontal logo
      className={cn(className)}
      {...props}
    >
      <style>
        {`
          .logo-text {
            font-family: var(--font-headline, sans-serif);
            font-size: 38px;
            font-weight: 700;
            fill: #0F4C75; /* pantone-blue-1 from your theme */
          }
          .fork-icon-path {
            fill: #2E8B57; /* pantone-green-2 from your theme */
          }
        `}
      </style>
      
      <rect width="200" height="50" rx="10" fill="#98FB98" />

      <text x="0" y="38" className="logo-text">
        TIME W
      </text>
      
      {/* Fork Icon replacing 'I' */}
      <g transform="translate(138, 2) scale(1.2)">
        <path
          className="fork-icon-path"
          d="M6,1 C6,1 6,5 6,7 C6,11 3,12 3,16 L3,28 L9,28 L9,16 C9,12 6,11 6,7 M3,1 L3,6 M9,1 L9,6 M6,1 L6,6"
          stroke="#2E8B57"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      <text x="157" y="38" className="logo-text">
        SE
      </text>

    </svg>
  )
);

LogoIcon.displayName = 'LogoIcon';

export default LogoIcon;
