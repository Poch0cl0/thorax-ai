import { useMemo, useState } from 'react'
import {
  CalendarClock,
  Eye,
  Loader2,
  PlayCircle,
  Stethoscope,
  User,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useClinicalViewModel } from '../hooks/useClinicalViewModel'
import { isAdminUser } from '../services/clinicalRepository'
import type { AppointmentRecord } from '../types/clinical-domain'
import { AttendAppointmentModal } from '../features/appointments/AttendAppointmentModal'
import { MedicoAppointmentDetailModal } from '../features/appointments/MedicoAppointmentDetailModal'

type Tab = 'pendiente' | 'atendida'

export function AttendQueuePage() {
  const { user } = useAuth()
  const { vm, loading, mode, refreshApi } = useClinicalViewModel()
  const [tab, setTab] = useState<Tab>('pendiente')
  const [attendModalFor, setAttendModalFor] = useState<{
    appointment: AppointmentRecord
    patientName: string
    patientBirthDate: string | null
  } | null>(null)
  const [detailAppointment, setDetailAppointment] = useState<AppointmentRecord | null>(null)

  const patientById = useMemo(() => {
    const m = new Map<string, { name: string; birthDate: string | null }>()
    vm?.patients.forEach((p) =>
      m.set(p.id, { name: p.full_name, birthDate: p.birth_date ?? null }),
    )
    return m
  }, [vm])

  const isAdmin = isAdminUser(user)

  const queue = useMemo(() => {
    if (!vm || !user) return []
    const medicoId = user.medico_id
    let rows = vm.appointments.filter((a) => a.status === tab)
    if (mode === 'api' && medicoId && !isAdmin) {
      rows = rows.filter(
        (a) =>
          !a.specialist_id || Number.parseInt(a.specialist_id, 10) === medicoId,
      )
    }
    return [...rows].sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
    )
  }, [vm, user, mode, isAdmin, tab])

  if (loading || !vm || !user) {
    return (
      <div className="rounded-xl border border-thorax-border bg-thorax-card p-8 text-thorax-muted">
        <Loader2 className="mb-2 inline h-6 w-6 animate-spin" />
        {' '}
        Cargando citas…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-thorax-text">Mis citas</h1>
        <p className="mt-1 text-sm text-thorax-muted">
          Consulte sus citas asignadas, atienda pacientes y registre datos clínicos.
        </p>
      </header>

      <div className="flex gap-2 border-b border-thorax-border">
        {(['pendiente', 'atendida'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px ${
              tab === t
                ? 'border-thorax-accent text-thorax-accent'
                : 'border-transparent text-thorax-muted hover:text-thorax-text'
            }`}
          >
            {t === 'pendiente' ? 'Pendientes' : 'Atendidas'}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {queue.map((a) => {
          const patientInfo = patientById.get(a.patient_id)
          const patientName = patientInfo?.name ?? 'Paciente'
          const t = new Date(a.scheduled_at)
          return (
            <li
              key={a.id}
              className="rounded-xl border border-thorax-border bg-thorax-card px-5 py-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="flex items-center gap-2 font-medium text-thorax-text">
                    <User className="h-4 w-4 shrink-0 text-thorax-accent" />
                    {patientName}
                  </p>
                  <p className="flex items-center gap-2 text-xs text-thorax-muted">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {t.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  {a.notes && (
                    <p className="flex items-start gap-2 pt-1 text-xs text-thorax-muted">
                      <Stethoscope className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {a.notes}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailAppointment(a)}
                    className="flex items-center gap-1 rounded-lg border border-thorax-border px-3 py-2 text-xs text-thorax-muted hover:text-thorax-text"
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </button>
                  {a.status === 'pendiente' && (
                    <button
                      type="button"
                      disabled={mode === 'mock' || (!isAdmin && !user.medico_id)}
                      onClick={() =>
                        setAttendModalFor({
                          appointment: a,
                          patientName,
                          patientBirthDate: patientInfo?.birthDate ?? null,
                        })
                      }
                      className="flex items-center gap-1.5 rounded-lg bg-thorax-accent/90 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-thorax-accent-hover disabled:opacity-40"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Atender
                    </button>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {queue.length === 0 && (
        <p className="rounded-xl border border-dashed border-thorax-border/80 bg-thorax-card-alt/80 px-4 py-8 text-center text-sm text-thorax-muted">
          No tiene citas {tab === 'pendiente' ? 'pendientes' : 'atendidas'}.
        </p>
      )}

      {attendModalFor && (
        <AttendAppointmentModal
          appointment={attendModalFor.appointment}
          patientName={attendModalFor.patientName}
          patientBirthDate={attendModalFor.patientBirthDate}
          onClose={() => setAttendModalFor(null)}
          onSuccess={() => {
            setAttendModalFor(null)
            refreshApi()
          }}
        />
      )}

      <MedicoAppointmentDetailModal
        open={detailAppointment != null}
        appointment={detailAppointment}
        patientName={
          detailAppointment
            ? patientById.get(detailAppointment.patient_id)?.name
            : undefined
        }
        onClose={() => setDetailAppointment(null)}
      />
    </div>
  )
}
