'use client';

import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface FoldersIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FoldersIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const FoldersIcon = forwardRef<FoldersIconHandle, FoldersIconProps>(
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
          <path
            className={cn(
              "transition-transform duration-300 ease-out",
              isAnimating && "transform -translate-x-0.5 translate-y-0.5"
            )}
            d="M20 17a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.9a2 2 0 0 1-1.69-.9l-.81-1.2a2 2 0 0 0-1.67-.9H8a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z"
          />
          <path
            className={cn(
              "transition-all duration-300 ease-out",
              isAnimating && "transform translate-x-0.5 -translate-y-0.5 opacity-0 scale-95"
            )}
            d="M2 8v11a2 2 0 0 0 2 2h14"
          />
        </svg>
      </div>
    );
  }
);

FoldersIcon.displayName = 'FoldersIcon';

export { FoldersIcon };
