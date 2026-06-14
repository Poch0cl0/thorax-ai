import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { AppointmentRecord } from '../../types/clinical-domain'
import * as clinicalService from '../../services/clinicalService'
import { AppBadge } from '../../components/ui/AppBadge'
import { ClinicalDataDisplay } from '../clinical/ClinicalDataDisplay'

type Props = {
  open: boolean
  appointment: AppointmentRecord | null
  patientName?: string
  onClose: () => void
}

export function MedicoAppointmentDetailModal({ open, appointment, patientName, onClose }: Props) {
  const [clinical, setClinical] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !appointment) {
      setClinical(null)
      return
    }
    setLoading(true)
    clinicalService
      .listClinicalData({ cita_id: Number(appointment.id) })
      .then((rows) => setClinical(rows[0] ?? null))
      .catch(() => setClinical(null))
      .finally(() => setLoading(false))
  }, [open, appointment])

  if (!open || !appointment) return null

  const t = new Date(appointment.scheduled_at)
  const pred = appointment.predicciones?.[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 z-10 cursor-default bg-black/55" aria-label="Cerrar" onClick={onClose} />
      <div className="relative z-20 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-thorax-border bg-thorax-card-alt p-6 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-thorax-text">Detalle de la cita</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-thorax-muted hover:text-thorax-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-thorax-muted">Paciente</dt><dd className="font-medium text-thorax-text">{patientName ?? '—'}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-thorax-muted">Fecha</dt><dd>{t.toLocaleString('es-PE')}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-thorax-muted">Estado</dt><dd className="capitalize">{appointment.status}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-thorax-muted">Motivo</dt><dd className="text-right">{appointment.notes ?? '—'}</dd></div>
        </dl>

        <div className="mt-6 rounded-xl border border-thorax-border bg-thorax-bg-deep p-4">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-thorax-accent" />
          ) : (
            <ClinicalDataDisplay
              data={clinical}
              title="Datos clínicos de la atención"
            />
          )}
        </div>

        {pred && (
          <div className="mt-4 rounded-xl border border-thorax-border bg-thorax-bg-deep p-4">
            <h4 className="text-sm font-semibold text-thorax-text mb-2">Predicción IA asociada</h4>
            <p className="text-sm">{pred.clase_predicha ?? pred.disease_class} — {(Number(pred.probabilidad ?? pred.risk_score ?? 0) * 100).toFixed(1)}%</p>
            <AppBadge variant="warning" className="mt-2">{pred.nivel_riesgo ?? 'Riesgo'}</AppBadge>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-xl bg-thorax-accent px-4 py-2 text-sm font-semibold text-slate-900">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
