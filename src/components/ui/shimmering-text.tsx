"use client"

import { cn } from "@/lib/utils"

interface ShimmeringTextProps {
  text: string
  className?: string
}

export function ShimmeringText({ text, className }: ShimmeringTextProps) {
  return (
    <span
      className={cn(
        "inline-block bg-gradient-to-r from-foreground via-muted-foreground to-foreground bg-[length:200%_100%] bg-clip-text text-transparent animate-[shimmer_2s_ease-in-out_infinite]",
        className
      )}
    >
      {text}
    </span>
  )
}
