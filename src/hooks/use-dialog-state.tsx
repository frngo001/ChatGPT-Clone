import { useState } from 'react'

/**
 * Custom hook for managing dialog state with toggle functionality
 * 
 * @description Provides a stateful dialog management system that supports
 * different dialog types and automatic toggle behavior.
 * 
 * @template T - Type of dialog state (string or boolean)
 * @param initialState - Initial dialog state (optional)
 * @returns Tuple containing current state and toggle function
 */
export default function useDialogState<T extends string | boolean>(
  initialState: T | null = null
) {
  const [open, _setOpen] = useState<T | null>(initialState)

  const setOpen = (str: T | null) =>
    _setOpen((prev) => (prev === str ? null : str))

  return [open, setOpen] as const
}
