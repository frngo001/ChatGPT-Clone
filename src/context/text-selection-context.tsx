"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface SelectionPosition {
  x: number
  y: number
  width: number
}

interface TextSelectionContextType {
  selectedText: string | null
  selectionPosition: SelectionPosition | null
  setSelection: (text: string | null, position: SelectionPosition | null) => void
  clearSelection: () => void
}

export const TextSelectionContext = createContext<TextSelectionContextType | null>(null)

type TextSelectionProviderProps = {
  children: ReactNode
}

export function TextSelectionProvider({ children }: TextSelectionProviderProps) {
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const [selectionPosition, setSelectionPosition] = useState<SelectionPosition | null>(null)

  const setSelection = useCallback((text: string | null, position: SelectionPosition | null) => {
    setSelectedText(text)
    setSelectionPosition(position)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedText(null)
    setSelectionPosition(null)
  }, [])

  return (
    <TextSelectionContext.Provider
      value={{
        selectedText,
        selectionPosition,
        setSelection,
        clearSelection,
      }}
    >
      {children}
    </TextSelectionContext.Provider>
  )
}

export const useTextSelection = () => {
  const context = useContext(TextSelectionContext)

  if (!context) {
    throw new Error('useTextSelection must be used within TextSelectionProvider')
  }

  return context
}

