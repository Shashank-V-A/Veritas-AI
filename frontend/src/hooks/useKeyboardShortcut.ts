import { useEffect } from 'react'

type ShortcutOptions = {
  metaOrCtrl?: boolean
  shift?: boolean
  enabled?: boolean
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options?: ShortcutOptions,
) {
  const metaOrCtrl = options?.metaOrCtrl ?? true
  const shift = options?.shift ?? false
  const enabled = options?.enabled ?? true

  useEffect(() => {
    if (!enabled) return

    function handler(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return

      const modifierOk = metaOrCtrl
        ? event.metaKey || event.ctrlKey
        : !event.metaKey && !event.ctrlKey

      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        modifierOk &&
        event.shiftKey === shift
      ) {
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, callback, metaOrCtrl, shift, enabled])
}
