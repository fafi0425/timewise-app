
'use client';

import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

type MarkerStyle = {
  '--delay': string;
  '--r-start': string;
};

export default function AnimatedClock() {
  const [markerStyles, setMarkerStyles] = useState<MarkerStyle[]>([]);
  const hourMarkers = Array.from({ length: 12 }, (_, i) => i);
  const circleCircumference = 2 * Math.PI * 48; // 2 * pi * r

  useEffect(() => {
    // Generate styles only on the client, after the component has mounted
    const styles = hourMarkers.map((_, i) => {
        return {
            '--delay': `${i * 0.1}s`,
            '--r-start': `0deg`
        };
    });
    setMarkerStyles(styles);
  }, []); // Empty dependency array ensures this runs only once on the client

  return (
    <div className="relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] xl:w-[500px] xl:h-[500px]">
      <style jsx>{`
        @keyframes drawCircle {
          to {
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes assembleFromLine {
          0% {
            opacity: 0;
            /* Start from top-left corner, relative to the SVG center */
            transform: translate(-100px, -100px) scale(0.5) rotate(-90deg);
          }
          40% {
            opacity: 1;
            /* Form a horizontal line */
            transform: translate(0, 0) scale(0.8) rotate(0deg);
          }
          100% {
            opacity: 1;
            /* End in final position */
            transform: translate(0, 0) scale(1) rotate(var(--r-end));
          }
        }

        @keyframes assembleHand {
            from {
                opacity: 0;
                transform: rotate(var(--r-start));
            }
            to {
                opacity: 1;
                transform: rotate(var(--r-end));
            }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .clock-face {
          animation: drawCircle 1.5s cubic-bezier(0.5, 1, 0.5, 1) forwards;
        }
        
        .hour-marker {
          transform-origin: center;
          animation: assembleFromLine 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          animation-delay: var(--delay);
          opacity: 0;
        }
        
        .hand, .center-dot {
          transform-origin: center;
          animation: assembleHand 2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        
        .hour-hand { animation-delay: 1.5s; }
        .minute-hand { animation-delay: 1.7s; }
        .center-dot { animation: fadeIn 0.5s ease-out 1.8s forwards; opacity: 0; }
      `}</style>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }}
      >
        {/* Clock Face with line drawing animation */}
        <circle
          className="clock-face"
          cx="50"
          cy="50"
          r="48"
          fill="rgba(255, 255, 255, 0.3)"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="2"
          strokeDasharray={circleCircumference}
          strokeDashoffset={circleCircumference}
          transform="rotate(-90 50 50)"
        />

        {/* Hour Markers */}
        {markerStyles.length > 0 && hourMarkers.map((hour, i) => {
          const angle = hour * 30;

          return (
            <g
              key={hour}
              className="hour-marker"
              style={{
                // @ts-ignore
                '--delay': `${i * 0.1}s`,
                '--r-end': `${angle}deg`
              }}
            >
              <line
                x1="50"
                y1="5"
                x2="50"
                y2={hour % 3 === 0 ? "12" : "8"}
                stroke="hsl(var(--primary-foreground))"
                strokeWidth={hour % 3 === 0 ? "1.5" : "0.75"}
                strokeLinecap="round"
              />
            </g>
          )
        })}

        {/* Hour Hand */}
        <line
          className="hand hour-hand"
          x1="50"
          y1="50"
          x2="50"
          y2="30"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ 
            // @ts-ignore
            '--r-start': '-120deg', '--r-end': '150deg' 
            }}
        />
        {/* Minute Hand */}
        <line
          className="hand minute-hand"
          x1="50"
          y1="50"
          x2="50"
          y2="20"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="1.5"
          strokeLinecap="round"
           style={{ 
            // @ts-ignore
            '--r-start': '270deg', '--r-end': '30deg' 
            }}
        />

         {/* Center dot */}
         <circle cx="50" cy="50" r="3" fill="hsl(var(--primary-foreground))" className="center-dot" />

      </svg>
    </div>
  );
}
