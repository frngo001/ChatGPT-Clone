import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface ButtonWithTooltipProps {
  children: React.ReactNode;
  toolTipText: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const ButtonWithTooltip: React.FC<ButtonWithTooltipProps> = ({
  children,
  toolTipText,
  side = 'top',
  className,
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild className={className}>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side}>
          <p>{toolTipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ButtonWithTooltip;
