import { X } from 'lucide-react'

export type PatientFormData = {
  dni: string
  nombres: string
  apellidos: string
  fecha_nacimiento: string
  sexo: string
  telefono: string
  email: string
  direccion: string
}

type Props = {
  open: boolean
  title: string
  formData: PatientFormData
  busy: boolean
  error: string | null
  onClose: () => void
  onChange: (data: PatientFormData) => void
  onSubmit: (e: React.FormEvent) => void
}

export function PatientFormModal({
  open,
  title,
  formData,
  busy,
  error,
  onClose,
  onChange,
  onSubmit,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-thorax-border bg-thorax-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-thorax-border/60 pb-4">
          <h2 className="text-xl font-bold text-thorax-text">{title}</h2>
          <button type="button" onClick={onClose} className="text-thorax-muted hover:text-thorax-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-thorax-muted">Nombres</label>
              <input
                required
                value={formData.nombres}
                onChange={(e) => onChange({ ...formData, nombres: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-thorax-muted">Apellidos</label>
              <input
                required
                value={formData.apellidos}
                onChange={(e) => onChange({ ...formData, apellidos: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-thorax-muted">DNI</label>
              <input
                required
                maxLength={8}
                value={formData.dni}
                onChange={(e) => onChange({ ...formData, dni: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-thorax-muted">Fecha de Nacimiento</label>
              <input
                required
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => onChange({ ...formData, fecha_nacimiento: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-thorax-muted">Sexo</label>
              <select
                required
                value={formData.sexo}
                onChange={(e) => onChange({ ...formData, sexo: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent outline-none"
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-thorax-muted">Teléfono</label>
              <input
                value={formData.telefono}
                onChange={(e) => onChange({ ...formData, telefono: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-thorax-muted">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => onChange({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-thorax-muted">Dirección</label>
              <input
                value={formData.direccion}
                onChange={(e) => onChange({ ...formData, direccion: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent outline-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-thorax-border/60">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-thorax-border px-4 py-2 text-sm font-medium text-thorax-text hover:bg-thorax-card-alt"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-thorax-accent px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-thorax-accent-hover disabled:opacity-60"
            >
              {busy ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
