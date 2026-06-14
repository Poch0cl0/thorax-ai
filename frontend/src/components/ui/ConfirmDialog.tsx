import { Loader2, X } from 'lucide-react'

type Props = {
  open: boolean
  title: string
  message: string
  error?: string | null
  confirmLabel?: string
  cancelLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  error = null,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-thorax-border bg-thorax-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-thorax-text">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="text-thorax-muted hover:text-thorax-text disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-thorax-muted">{message}</p>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-thorax-border px-4 py-2 text-sm font-medium text-thorax-text hover:bg-thorax-card-alt disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-red-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
