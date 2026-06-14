import { useEffect, useState } from 'react'
import { X, Loader2, Save } from 'lucide-react'
import * as clinicalService from '../../services/clinicalService'
import { apiFetch } from '../../services/api'
import type { AppointmentRecord } from '../../types/clinical-domain'
import { useAuth } from '../../context/useAuth'
import { isAdminUser } from '../../services/clinicalRepository'
import { patientAgeYears } from '../../utils/age'
import {
  ClinicalDataForm,
  clinicalDataToPayload,
  emptyClinicalData,
  type ClinicalDataFormValues,
} from '../clinical/ClinicalDataForm'

type AttendModalProps = {
  appointment: AppointmentRecord
  patientName: string
  patientBirthDate?: string | null
  onClose: () => void
  onSuccess: () => void
}

export function AttendAppointmentModal({
  appointment,
  patientName,
  patientBirthDate,
  onClose,
  onSuccess,
}: AttendModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<ClinicalDataFormValues>(emptyClinicalData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const age = patientAgeYears(patientBirthDate ?? null)
    setFormData((prev) => ({
      ...prev,
      edad: age != null ? String(age) : '',
    }))
  }, [patientBirthDate, appointment.patient_id])

  function handleFormChange(values: ClinicalDataFormValues) {
    const age = patientAgeYears(patientBirthDate ?? null)
    setFormData({
      ...values,
      edad: age != null ? String(age) : '',
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const isAdmin = isAdminUser(user)
    const medicoId = user?.medico_id ?? (isAdmin && appointment.specialist_id
      ? Number.parseInt(appointment.specialist_id, 10)
      : null)

    if (!medicoId) {
      setError('No se encontró el perfil médico para esta atención.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const payload = clinicalDataToPayload(
        formData,
        Number(appointment.patient_id),
        medicoId,
        Number(appointment.id),
      )
      await apiFetch('/api/v1/datos-clinicos', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      await clinicalService.updateAppointment(Number(appointment.id), {
        status: 'atendida',
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al finalizar la atención')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-thorax-border bg-thorax-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-thorax-border/60 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-thorax-text">Atender consulta</h2>
            <p className="text-sm text-thorax-muted mt-1">{patientName}</p>
          </div>
          <button type="button" onClick={onClose} className="text-thorax-muted hover:text-thorax-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <ClinicalDataForm
            values={formData}
            onChange={handleFormChange}
            disabled={loading}
            edadReadOnly
          />
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
          <div className="mt-6 flex justify-end gap-3 border-t border-thorax-border/60 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-thorax-border px-4 py-2 text-sm font-medium text-thorax-text hover:bg-thorax-card-alt"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-thorax-accent px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-thorax-accent-hover disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Finalizar atención
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
