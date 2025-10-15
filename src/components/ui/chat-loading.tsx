"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ShimmeringText } from "@/components/ui/shimmering-text"

// The phrases are now provided in German for the chat loading indicator.
// Added more phrases for a richer chat loading indicator experience.
const phrases = [
  "Analysiere deine Nachricht...",
  "Agent denkt nach...",
  "Verarbeite deine Anfrage...",
  "Gleich geschafft...",
  "Eine Sekunde noch...",
]

export function ChatLoading() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % phrases.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center py-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <ShimmeringText text={phrases[currentIndex]} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
