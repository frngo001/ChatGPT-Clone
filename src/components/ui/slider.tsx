"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ value, onValueChange, min = 0, max = 100, step = 1, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange([parseFloat(e.target.value)])
    }

    const percentage = ((value[0] - min) / (max - min)) * 100

    return (
      <div className={cn("relative flex w-full items-center py-2", className)}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleChange}
          className={cn(
            "w-full h-2 rounded-full appearance-none cursor-pointer",
            "bg-muted/70 dark:bg-muted/60",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            // Thumb styling - immer sichtbar mit klarem Kontrast
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-background",
            "[&::-webkit-slider-thumb]:shadow-2xl [&::-webkit-slider-thumb]:shadow-black/50 dark:[&::-webkit-slider-thumb]:shadow-black/70",
            "[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all",
            "[&::-webkit-slider-thumb]:ring-[3px] [&::-webkit-slider-thumb]:ring-background/90",
            // Firefox thumb styling
            "[&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:appearance-none",
            "[&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-background",
            "[&::-moz-range-thumb]:shadow-2xl [&::-moz-range-thumb]:shadow-black/50 dark:[&::-moz-range-thumb]:shadow-black/70",
            "[&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-all",
            "[&::-moz-range-thumb]:ring-[3px] [&::-moz-range-thumb]:ring-background/90",
            // Hover effects
            "[&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:hover:ring-background",
            "[&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:hover:ring-background"
          )}
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${percentage}%, hsl(var(--muted)) ${percentage}%, hsl(var(--muted)) 100%)`
          }}
          {...props}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
