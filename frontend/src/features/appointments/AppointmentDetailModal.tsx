import { X } from 'lucide-react'
import type { AppointmentRecord, PatientRecord, SpecialistRecord } from '../../types/clinical-domain'

type Props = {
  open: boolean
  appointment: AppointmentRecord | null
  patient: PatientRecord | undefined
  specialist: SpecialistRecord | undefined
  onClose: () => void
}

const statusLabel: Record<string, string> = {
  pendiente: 'Pendiente',
  atendida: 'Atendida',
  cancelada: 'Cancelada',
  en_proceso: 'En proceso',
  atendido: 'Atendida',
  cancelado: 'Cancelada',
}

export function AppointmentDetailModal({ open, appointment, patient, specialist, onClose }: Props) {
  if (!open || !appointment) return null

  const t = new Date(appointment.scheduled_at)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 z-10 cursor-default bg-black/55" aria-label="Cerrar" onClick={onClose} />
      <div className="relative z-20 w-full max-w-md rounded-2xl border border-thorax-border bg-thorax-card-alt p-6 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-thorax-text">Detalle de la cita</h3>
          <button type="button" className="rounded-lg p-1 text-thorax-muted hover:bg-thorax-bg-deep hover:text-thorax-text" onClick={onClose}>
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-thorax-border/40 pb-2">
            <dt className="text-thorax-muted">Paciente</dt>
            <dd className="font-medium text-thorax-text text-right">{patient?.full_name ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-thorax-border/40 pb-2">
            <dt className="text-thorax-muted">Médico</dt>
            <dd className="text-thorax-text text-right">{specialist?.display_name ?? 'Sin asignar'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-thorax-border/40 pb-2">
            <dt className="text-thorax-muted">Fecha y hora</dt>
            <dd className="text-thorax-text text-right">{t.toLocaleString('es-PE')}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-thorax-border/40 pb-2">
            <dt className="text-thorax-muted">Estado</dt>
            <dd className="text-thorax-text">{statusLabel[appointment.status] ?? appointment.status}</dd>
          </div>
          <div className="flex justify-between gap-4 pb-2">
            <dt className="text-thorax-muted">Motivo</dt>
            <dd className="text-thorax-text text-right">{appointment.notes ?? '—'}</dd>
          </div>
        </dl>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-xl bg-thorax-accent px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-thorax-accent-hover">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
