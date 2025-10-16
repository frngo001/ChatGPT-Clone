/**
 * Copyright 2023 Vercel, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use client';

import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import React, { type ComponentProps, useCallback, useEffect, useState, createContext, useContext } from 'react';

// Context to share carousel API with child components
const CarouselApiContext = createContext<CarouselApi | undefined>(undefined);

// Hook to access carousel API from the nearest InlineCitationCarousel parent
const useCarouselApi = () => {
  const api = useContext(CarouselApiContext);
  return api;
};

export type InlineCitationProps = ComponentProps<'span'>;

export const InlineCitation = ({
  className,
  ...props
}: InlineCitationProps) => (
  <span
    className={cn('group inline items-center gap-1', className)}
    {...props}
  />
);

export type InlineCitationTextProps = ComponentProps<'span'>;

export const InlineCitationText = ({
  className,
  ...props
}: InlineCitationTextProps) => (
  <span
    className={cn('transition-colors group-hover:bg-accent', className)}
    {...props}
  />
);

export type InlineCitationCardProps = ComponentProps<typeof HoverCard>;

export const InlineCitationCard = React.forwardRef<
  React.ElementRef<typeof HoverCard>,
  InlineCitationCardProps
>((props, ref) => (
  <HoverCard closeDelay={0} openDelay={0} {...props} />
));
InlineCitationCard.displayName = "InlineCitationCard";

export type InlineCitationCardTriggerProps = ComponentProps<typeof Badge> & {
  sources: string[];
};

export const InlineCitationCardTrigger = ({
  sources,
  className,
  ...props
}: InlineCitationCardTriggerProps) => {
  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  };

  return (
    <HoverCardTrigger asChild>
      <Badge
        className={cn('ml-1 rounded-full cursor-pointer', className)}
        variant="secondary"
        {...props}
      >
        {sources.length ? (
          <>
            {getHostname(sources[0])}{' '}
            {sources.length > 1 && `+${sources.length - 1}`}
          </>
        ) : (
          'unknown'
        )}
      </Badge>
    </HoverCardTrigger>
  );
};

export type InlineCitationCardBodyProps = ComponentProps<'div'>;

export const InlineCitationCardBody = ({
  className,
  ...props
}: InlineCitationCardBodyProps) => (
  <HoverCardContent className={cn('relative w-80 p-0', className)} {...props} />
);

export type InlineCitationCarouselProps = ComponentProps<typeof Carousel>;

export const InlineCitationCarousel = ({
  className,
  children,
  ...props
}: InlineCitationCarouselProps) => {
  const [api, setApi] = useState<CarouselApi>();
  
  return (
    <CarouselApiContext.Provider value={api}>
      <Carousel 
        className={cn('w-full', className)}
        setApi={setApi}
        {...props}
      >
        {children}
      </Carousel>
    </CarouselApiContext.Provider>
  );
};

export type InlineCitationCarouselContentProps = ComponentProps<'div'>;

export const InlineCitationCarouselContent = (
  props: InlineCitationCarouselContentProps
) => <CarouselContent {...props} />;

export type InlineCitationCarouselItemProps = ComponentProps<'div'>;

export const InlineCitationCarouselItem = ({
  className,
  ...props
}: InlineCitationCarouselItemProps) => (
  <CarouselItem className={cn('w-full space-y-2 p-4', className)} {...props} />
);

export type InlineCitationCarouselHeaderProps = ComponentProps<'div'>;

export const InlineCitationCarouselHeader = ({
  className,
  ...props
}: InlineCitationCarouselHeaderProps) => (
  <div
    className={cn(
      'flex items-center justify-between gap-2 rounded-t-md bg-secondary p-2',
      className
    )}
    {...props}
  />
);

export type InlineCitationCarouselIndexProps = ComponentProps<'div'>;

export const InlineCitationCarouselIndex = ({
  children,
  className,
  ...props
}: InlineCitationCarouselIndexProps) => {
  const api = useCarouselApi();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <div
      className={cn(
        'flex flex-1 items-center justify-end px-3 py-1 text-muted-foreground text-xs',
        className
      )}
      {...props}
    >
      {children ?? `${current}/${count}`}
    </div>
  );
};

export type InlineCitationCarouselPrevProps = ComponentProps<'button'>;

export const InlineCitationCarouselPrev = ({
  className,
  ...props
}: InlineCitationCarouselPrevProps) => {
  const api = useCarouselApi();

  const handleClick = useCallback(() => {
    if (api) {
      api.scrollPrev();
    }
  }, [api]);

  return (
    <button
      aria-label="Previous"
      className={cn('shrink-0', className)}
      onClick={handleClick}
      type="button"
      {...props}
    >
      <ArrowLeft className="size-4" />
    </button>
  );
};

export type InlineCitationCarouselNextProps = ComponentProps<'button'>;

export const InlineCitationCarouselNext = ({
  className,
  ...props
}: InlineCitationCarouselNextProps) => {
  const api = useCarouselApi();

  const handleClick = useCallback(() => {
    if (api) {
      api.scrollNext();
    }
  }, [api]);

  return (
    <button
      aria-label="Next"
      className={cn('shrink-0', className)}
      onClick={handleClick}
      type="button"
      {...props}
    >
      <ArrowRight className="size-4" />
    </button>
  );
};

export type InlineCitationSourceProps = ComponentProps<'div'> & {
  title: string;
  url: string;
  description?: string;
};

export const InlineCitationSource = ({
  title,
  url,
  description,
  className,
  ...props
}: InlineCitationSourceProps) => (
  <div className={cn('space-y-1', className)} {...props}>
    <a
      className="font-medium text-sm hover:underline line-clamp-1"
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      {title}
    </a>
    {description && (
      <p className="text-muted-foreground text-xs line-clamp-2">{description}</p>
    )}
    <p className="text-muted-foreground text-xs truncate">{url}</p>
  </div>
);

export type InlineCitationQuoteProps = ComponentProps<'blockquote'>;

export const InlineCitationQuote = ({
  className,
  ...props
}: InlineCitationQuoteProps) => (
  <blockquote
    className={cn(
      'border-l-2 border-muted-foreground/20 pl-3 text-muted-foreground text-sm italic',
      className
    )}
    {...props}
  />
);

