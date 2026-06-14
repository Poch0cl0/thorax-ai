import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import type { PatientRecord } from '../../types/clinical-domain'
import { patientAgeYears } from '../../utils/age'

type Props = {
  open: boolean
  patient: PatientRecord | null
  onClose: () => void
}

export function PatientDetailModal({ open, patient, onClose }: Props) {
  if (!open || !patient) return null

  const age = patientAgeYears(patient.birth_date)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-thorax-border bg-thorax-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-thorax-border/60 pb-4">
          <h2 className="text-xl font-bold text-thorax-text">Detalle del paciente</h2>
          <button type="button" onClick={onClose} className="text-thorax-muted hover:text-thorax-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-thorax-border/40 pb-2">
            <dt className="text-thorax-muted">Nombre</dt>
            <dd className="font-medium text-thorax-text text-right">{patient.full_name}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-thorax-border/40 pb-2">
            <dt className="text-thorax-muted">DNI</dt>
            <dd className="text-thorax-text">{patient.dni ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-thorax-border/40 pb-2">
            <dt className="text-thorax-muted">Edad</dt>
            <dd className="text-thorax-text">{age != null ? `${age} años` : '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-thorax-border/40 pb-2">
            <dt className="text-thorax-muted">Sexo</dt>
            <dd className="text-thorax-text">{patient.gender ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-thorax-border/40 pb-2">
            <dt className="text-thorax-muted">Teléfono</dt>
            <dd className="text-thorax-text">{patient.phone ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-thorax-border/40 pb-2">
            <dt className="text-thorax-muted">Email</dt>
            <dd className="text-thorax-text">{patient.email ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 pb-2">
            <dt className="text-thorax-muted">Dirección</dt>
            <dd className="text-thorax-text text-right">{patient.address ?? '—'}</dd>
          </div>
        </dl>

        <div className="mt-6 flex justify-end gap-3">
          <Link
            to={`/patients/${patient.id}`}
            className="rounded-lg border border-thorax-border px-4 py-2 text-sm font-medium text-thorax-accent hover:bg-thorax-bg-deep"
            onClick={onClose}
          >
            Ver perfil completo
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-thorax-accent px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-thorax-accent-hover"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
