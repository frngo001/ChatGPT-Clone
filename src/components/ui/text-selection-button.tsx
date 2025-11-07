"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useTextSelection } from '@/context/text-selection-context'
import { MessageCircleQuestionMark  } from 'lucide-react'
import { useEffect, useState } from 'react'

interface TextSelectionButtonProps {
  onAsk: (selectedText: string) => void
}

export function TextSelectionButton({ onAsk }: TextSelectionButtonProps) {
  const { selectedText, selectionPosition, clearSelection } = useTextSelection()
  const [buttonPosition, setButtonPosition] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!selectionPosition) {
      setButtonPosition(null)
      return
    }

    // Berechne Button-Position oberhalb der Selektion
    const buttonHeight = 36 // Geschätzte Button-Höhe
    const spacing = 8 // Abstand zur Selektion
    const buttonWidth = 100 // Geschätzte Button-Breite
    
    let top = selectionPosition.y - buttonHeight - spacing
    let left = selectionPosition.x + selectionPosition.width / 2 - buttonWidth / 2
    
    // Stelle sicher, dass der Button nicht außerhalb des Viewports ist
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Korrigiere horizontale Position
    if (left < 10) {
      left = 10
    } else if (left + buttonWidth > viewportWidth - 10) {
      left = viewportWidth - buttonWidth - 10
    }
    
    // Korrigiere vertikale Position (falls zu weit oben)
    if (top < 10) {
      top = selectionPosition.y + selectionPosition.height + spacing
    }

    setButtonPosition({ top, left })
  }, [selectionPosition])

  // Schließe Selektion bei Scroll oder Klick außerhalb
  useEffect(() => {
    const handleScroll = () => {
      clearSelection()
    }

    const handleClickOutside = (e: MouseEvent) => {
      // Prüfe ob Klick außerhalb des Buttons ist
      const target = e.target as HTMLElement
      if (!target.closest('[data-text-selection-button]')) {
        clearSelection()
      }
    }

    if (selectedText) {
      window.addEventListener('scroll', handleScroll, true)
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectedText, clearSelection])

  const handleClick = () => {
    if (selectedText) {
      onAsk(selectedText)
      clearSelection()
    }
  }

  return (
    <AnimatePresence>
      {selectedText && buttonPosition && (
        <motion.div
          data-text-selection-button
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            top: `${buttonPosition.top}px`,
            left: `${buttonPosition.left}px`,
            zIndex: 1000,
            pointerEvents: 'auto',
          }}
        >
          <Button
            onClick={handleClick}
            size="sm"
            className="shadow-lg gap-2"
            variant="default"
          >
            <MessageCircleQuestionMark  className="w-4 h-4" />
            Fragen
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

