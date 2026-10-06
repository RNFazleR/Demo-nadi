import { useEffect, useRef } from 'react'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

// Perilaku fokus untuk dialog modal:
// - catat elemen pemicu DULU, baru pindahkan fokus ke `initialFocusRef` (bukan autoFocus,
//   karena autoFocus memindahkan fokus sebelum effect jalan sehingga pemicunya tak tercatat)
// - Tab/Shift+Tab tidak keluar dari dialog, Escape memanggil `onClose`
// - saat dialog ditutup, fokus kembali ke pemicu
export function useDialogFocus(dialogRef, initialFocusRef, onClose) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const trigger = document.activeElement
    initialFocusRef.current?.focus()
    return () => {
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus()
    }
  }, [initialFocusRef])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const items = [...dialogRef.current.querySelectorAll(FOCUSABLE)]
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const inside = dialogRef.current.contains(document.activeElement)
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialogRef])
}
