"use client"

import { motion } from "framer-motion"
import { X, CornerDownRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"

interface ContextMessageProps {
  text: string
  onRemove?: () => void
  className?: string
  showRemoveButton?: boolean
}

export function ContextMessage({ text, onRemove, className, showRemoveButton = true }: ContextMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -5 }}
      transition={{ duration: 0.03 }}
      className={cn(
        "relative flex items-start gap-2 px-2 py-1.5 bg-background/50 rounded-md w-full max-w-full",
        className
      )}
    >
      {/* BadgeQuestionMark Icon links */}
      <div className="flex items-start flex-shrink-0 pt-0.5">
        <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      
      {/* Text-Inhalt mit Markdown-Unterstützung */}
      <div className={cn("min-w-0", showRemoveButton ? "pr-6" : "")}>
        <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          <ReactMarkdown
            components={{
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              p: ({ children }) => <span>{children}</span>,
            }}
          >
            {text}
          </ReactMarkdown>
        </div>
      </div>
      
      {/* X-Button rechts oben - nur anzeigen wenn showRemoveButton true ist */}
      {showRemoveButton && onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-1.5 right-1.5 h-5 w-5 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRemove()
          }}
          aria-label="Kontext entfernen"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </motion.div>
  )
}

