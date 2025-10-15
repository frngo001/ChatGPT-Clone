"use client"

import { memo } from "react"
import { Streamdown } from "streamdown"
import { cn } from "@/lib/utils"

interface ResponseProps {
  children: React.ReactNode
  className?: string
  [key: string]: any
}

const Response = memo(({ children, className, ...props }: ResponseProps) => {
  return (
    <div
      className={cn(
        // Remove top margin from first child and bottom margin from last child
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        // Ensure proper list styling
        "[&_ul]:list-disc [&_ol]:list-decimal [&_li]:leading-relaxed",
        className
      )}
      {...props}
    >
      <Streamdown>{String(children)}</Streamdown>
    </div>
  )
})

Response.displayName = "Response"

export { Response }
