import { X } from 'lucide-react'
import type { PatientRecord, SpecialistRecord } from '../../types/clinical-domain'

export type AvailabilitySlot = {
  id: number
  hora_inicio: string
  hora_fin: string
}

type Props = {
  open: boolean
  editing: boolean
  patients: PatientRecord[]
  specialists: SpecialistRecord[]
  patientId: string
  specialistId: string
  dateStr: string
  slotId: string
  notes: string
  availableSlots: AvailabilitySlot[]
  error: string | null
  busy: boolean
  onClose: () => void
  onPatientChange: (id: string) => void
  onSpecialistChange: (id: string) => void
  onDateChange: (date: string) => void
  onSlotChange: (slotId: string) => void
  onNotesChange: (notes: string) => void
  onSubmit: (e: React.FormEvent) => void
}

function slotLabel(slot: AvailabilitySlot) {
  const start = slot.hora_inicio.slice(0, 5)
  const end = slot.hora_fin.slice(0, 5)
  return `${start} – ${end}`
}

export function AppointmentFormModal({
  open,
  editing,
  patients,
  specialists,
  patientId,
  specialistId,
  dateStr,
  slotId,
  notes,
  availableSlots,
  error,
  busy,
  onClose,
  onPatientChange,
  onSpecialistChange,
  onDateChange,
  onSlotChange,
  onNotesChange,
  onSubmit,
}: Props) {
  if (!open) return null

  const canSubmit = patientId && specialistId && dateStr && slotId && availableSlots.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 z-10 cursor-default bg-black/55" aria-label="Cerrar" onClick={onClose} />
      <div className="relative z-20 w-full max-w-md rounded-2xl border border-thorax-border bg-thorax-card-alt p-6 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-thorax-text">{editing ? 'Editar Cita' : 'Nueva Cita'}</h3>
          <button type="button" className="rounded-lg p-1 text-thorax-muted hover:bg-thorax-bg-deep hover:text-thorax-text" onClick={onClose}>
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-thorax-muted">
            Paciente
            <select
              required
              value={patientId}
              onChange={(e) => onPatientChange(e.target.value)}
              className="rounded-xl border border-thorax-border bg-thorax-bg-deep px-3 py-2.5 text-sm normal-case text-thorax-text outline-none focus:ring-1 focus:ring-thorax-accent"
            >
              <option value="">Seleccionar paciente…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-thorax-muted">
            Doctor
            <select
              required
              value={specialistId}
              onChange={(e) => onSpecialistChange(e.target.value)}
              className="rounded-xl border border-thorax-border bg-thorax-bg-deep px-3 py-2.5 text-sm normal-case text-thorax-text outline-none focus:ring-1 focus:ring-thorax-accent"
            >
              <option value="">Seleccionar doctor…</option>
              {specialists.map((s) => (
                <option key={s.id} value={s.id}>{s.display_name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-thorax-muted">
            Fecha
            <input
              type="date"
              required
              value={dateStr}
              onChange={(e) => onDateChange(e.target.value)}
              className="rounded-xl border border-thorax-border bg-thorax-bg-deep px-3 py-2.5 text-sm normal-case text-thorax-text outline-none focus:ring-1 focus:ring-thorax-accent [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-thorax-muted">
            Horario disponible
            <select
              required
              value={slotId}
              onChange={(e) => onSlotChange(e.target.value)}
              className="rounded-xl border border-thorax-border bg-thorax-bg-deep px-3 py-2.5 text-sm normal-case text-thorax-text outline-none focus:ring-1 focus:ring-thorax-accent"
            >
              <option value="">Seleccionar horario…</option>
              {availableSlots.map((s) => (
                <option key={s.id} value={String(s.id)}>{slotLabel(s)}</option>
              ))}
            </select>
            {specialistId && dateStr && availableSlots.length === 0 && (
              <span className="text-[10px] normal-case text-thorax-danger">No hay disponibilidad en esta fecha.</span>
            )}
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-thorax-muted">
            Motivo de consulta
            <input
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Ej: Consulta de control, Seguimiento…"
              className="rounded-xl border border-thorax-border bg-thorax-bg-deep px-3 py-2.5 text-sm normal-case text-thorax-text outline-none focus:ring-1 focus:ring-thorax-accent"
            />
          </label>
          {error && <p className="text-sm text-thorax-danger">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!canSubmit || busy}
              className="flex-1 rounded-xl bg-thorax-accent py-2.5 text-sm font-semibold text-slate-900 hover:bg-thorax-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Guardando…' : editing ? 'Guardar Cambios' : 'Agendar cita'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-thorax-border bg-thorax-bg-deep py-2.5 text-sm font-medium text-thorax-text hover:bg-thorax-card">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
