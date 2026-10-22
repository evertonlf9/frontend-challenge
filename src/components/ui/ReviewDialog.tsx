import { useEffect, useRef, type ReactNode } from 'react'

export function ReviewDialog({
  open,
  onClose,
  children,
  labelledBy = 'review-title',
  describedBy,
  className,
  initialFocus,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  labelledBy?: string
  describedBy?: string
  className?: string
  initialFocus?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    if (open) document.body.style.overflow = 'hidden'
    if (open && dialog && !dialog.open) {
      dialog.showModal()
      if (initialFocus) dialog.querySelector<HTMLElement>(initialFocus)?.focus()
      else {
        const title = document.getElementById(labelledBy)
        if (title && dialog.contains(title)) {
          if (!title.hasAttribute('tabindex')) title.tabIndex = -1
          title.focus()
        }
      }
    }
    if (!open && dialog?.open) dialog.close()
    return () => {
      if (dialog?.open) {
        dialog.close()
        previousFocus?.focus()
      }
      if (open) document.body.style.overflow = previousOverflow
    }
  }, [open, initialFocus, labelledBy])
  return (
    <dialog
      ref={ref}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const elements = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]'
          ),
        ].filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0)
        const first = elements[0]
        const last = elements.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      className={
        className ??
        'm-auto bg-card text-foreground border border-border rounded-2xl p-6 w-[calc(100%_-_2rem)] max-w-lg max-h-[85svh] overflow-auto backdrop:bg-black/70'
      }
    >
      {children}
    </dialog>
  )
}
