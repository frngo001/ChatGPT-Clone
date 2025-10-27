import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface SunIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface SunIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const SunIcon = forwardRef<SunIconHandle, SunIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 16, ...props }, ref) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => setIsAnimating(true),
        stopAnimation: () => setIsAnimating(false),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          setIsAnimating(true);
        }
        onMouseEnter?.(e);
      },
      [onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          setIsAnimating(false);
        }
        onMouseLeave?.(e);
      },
      [onMouseLeave]
    );

    return (
      <div
        className={cn(className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          {[
            'M12 2v2',
            'm19.07 4.93-1.41 1.41',
            'M20 12h2',
            'm17.66 17.66 1.41 1.41',
            'M12 20v2',
            'm6.34 17.66-1.41 1.41',
            'M2 12h2',
            'm4.93 4.93 1.41 1.41',
          ].map((d, index) => (
            <path
              key={d}
              d={d}
              className={cn(
                "transition-opacity duration-300 ease-in-out",
                isAnimating && "opacity-100",
                !isAnimating && "opacity-100"
              )}
              style={{
                transitionDelay: isAnimating ? `${index * 0.05}s` : '0s',
              }}
            />
          ))}
        </svg>
      </div>
    );
  }
);

SunIcon.displayName = 'SunIcon';

export { SunIcon };

