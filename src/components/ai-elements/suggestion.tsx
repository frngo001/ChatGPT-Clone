'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type ComponentProps } from 'react';

export type SuggestionProps = ComponentProps<'div'>;

export const Suggestion = ({
  className,
  ...props
}: SuggestionProps) => (
  <div
    className={cn(
      'flex flex-col gap-2',
      className
    )}
    {...props}
  />
);

export type SuggestionsProps = ComponentProps<'div'>;

export const Suggestions = ({
  className,
  ...props
}: SuggestionsProps) => (
  <div
    className={cn(
      'w-full flex flex-col gap-2',
      className
    )}
    {...props}
  >
    {props.children}
  </div>
);

export type SuggestionItemProps = {
  suggestion: string;
  onClick?: (suggestion: string) => void;
} & Omit<ComponentProps<typeof Button>, 'onClick'>;

export const SuggestionItem = ({
  suggestion,
  onClick,
  className,
  ...props
}: SuggestionItemProps) => (
  <Button
    variant="outline"
    className={cn(
      'h-auto whitespace-normal text-left justify-start p-3 hover:bg-accent/50 transition-all duration-200 rounded-lg border border-border hover:border-accent-foreground/40 hover:shadow-sm group',
      className
    )}
    onClick={() => onClick?.(suggestion)}
    {...props}
  >
    <span className="text-sm text-foreground group-hover:text-foreground/90 leading-relaxed">
      {suggestion}
    </span>
  </Button>
);
