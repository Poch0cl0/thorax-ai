import { useMemo, useState } from 'react'
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Loader2,
  PlayCircle,
  Stethoscope,
  Upload,
  User,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useClinicalViewModel } from '../hooks/useClinicalViewModel'
import type {
  AppointmentRecord,
  AppointmentStatus,
} from '../types/clinical-domain'
import * as clinicalService from '../services/clinicalService'
import { AttendAppointmentModal } from '../features/appointments/AttendAppointmentModal'

function isOpenStatus(status: AppointmentStatus): boolean {
  return status === 'pendiente' || status === 'en_proceso'
}

export function AttendQueuePage() {
  const { user } = useAuth()
  const { vm, loading, mode, refreshApi } =
    useClinicalViewModel()

  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  
  // For AttendAppointmentModal
  const [attendModalFor, setAttendModalFor] = useState<{ appointment: AppointmentRecord; patientName: string } | null>(null)

  const patientById = useMemo(() => {
    const m = new Map<string, string>()
    vm?.patients.forEach((p) => m.set(p.id, p.full_name))
    return m
  }, [vm])

  const isAdmin =
    user?.role?.toLowerCase() === 'admin' ||
    !!user?.roles?.some((r) => r.toLowerCase() === 'admin')

  const queue = useMemo(() => {
    if (!vm || !user) return []
    const uid = user.id
    let rows = vm.appointments.filter((a) => isOpenStatus(a.status))

    if (mode === 'api' && uid > 0 && !isAdmin) {
      rows = rows.filter(
        (a) =>
          !a.specialist_id || Number.parseInt(a.specialist_id, 10) === uid,
      )
    }

    return [...rows].sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
    )
  }, [vm, user, mode, isAdmin])

  async function patchStatus(ap: AppointmentRecord, status: AppointmentStatus) {
    if (!user || mode === 'mock') {
      setMessage(
        'Este flujo necesita backend FastAPI activo y VITE_USE_CLINICAL_MOCK distinto de true.',
      )
      window.setTimeout(() => setMessage(null), 6500)
      return
    }
    const numId = Number.parseInt(ap.id, 10)
    if (!Number.isFinite(numId)) return

    setBusyId(ap.id)
    setMessage(null)
    try {
      const body: Parameters<typeof clinicalService.updateAppointment>[1] = {
        status,
      }
      if (status === 'en_proceso' && user.id > 0) {
        if (!ap.specialist_id) body.attending_user_id = user.id
      }

      await clinicalService.updateAppointment(numId, body)
      await refreshApi()
    } catch {
      setMessage('No se pudo actualizar la cita. ¿Permisos o sesión?')
    } finally {
      setBusyId(null)
    }
  }



  if (loading || !vm || !user) {
    return (
      <div className="rounded-xl border border-thorax-border bg-thorax-card p-8 text-thorax-muted">
        <Loader2 className="mb-2 inline h-6 w-6 animate-spin" />
        {' '}
        Cargando citas pendientes…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-thorax-text">
          Atender citas
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-thorax-muted">
          Lista de citas en estado pendiente o en proceso. Después de cargar una
          imagen compatible, puede ejecutarse el modelo de{' '}
          <strong className="font-medium text-thorax-text/90">apoyo a la revisión</strong>
          — el resultado no constituye por sí mismo un diagnóstico.
        </p>
        {mode === 'mock' && (
          <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/95">
            Modo MOCK: desactive{' '}
            <code className="text-thorax-accent">VITE_USE_CLINICAL_MOCK</code>{' '}
            para iniciar atenciones, cambiar estado y subir RX contra la API.
          </p>
        )}
      </header>

      {message && (
        <p className="rounded-xl border border-thorax-border bg-thorax-card-alt px-4 py-3 text-sm text-thorax-muted">
          {message}
        </p>
      )}

      <ul className="space-y-3">
        {queue.map((a) => {
          const patientName =
            patientById.get(a.patient_id) ?? 'Paciente'
          const t = new Date(a.scheduled_at)
          const pend = busyId === a.id
          const specOk =
            a.specialist_id == null ||
            Number.parseInt(a.specialist_id, 10) === user.id ||
            user.id <= 0

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
                    {t.toLocaleString('es-PE', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                    <span className="mx-1">·</span>
                    Estado:{' '}
                    <span className="text-thorax-text capitalize">
                      {a.status.replace('_', ' ')}
                    </span>
                  </p>
                  {a.notes && (
                    <p className="flex items-start gap-2 pt-1 text-xs text-thorax-muted">
                      <Stethoscope className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {a.notes}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {a.status === 'pendiente' && (
                    <button
                      type="button"
                      disabled={
                        pend ||
                        mode === 'mock' ||
                        user.id <= 0
                      }
                      onClick={() => {
                        if (!specOk) return
                        setAttendModalFor({ appointment: a, patientName })
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-thorax-accent/90 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-thorax-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                      title={
                        mode === 'mock'
                          ? 'Requiere API'
                          : 'Iniciar atención médica'
                      }
                    >
                      <PlayCircle className="h-4 w-4" />
                      Atender
                    </button>
                  )}
                </div>
              </div>

              {busyId === a.id && pend && (
                <div className="mt-3 flex items-center gap-2 text-xs text-thorax-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-thorax-accent" />
                  Actualizando…
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {queue.length === 0 && (
        <p className="rounded-xl border border-dashed border-thorax-border/80 bg-thorax-card-alt/80 px-4 py-8 text-center text-sm text-thorax-muted">
          No tiene citas abiertas asignadas. Las nuevas aparecerán al agendarlas
          desde Secretaría o cuando le asignen como médico.
        </p>
      )}

      {attendModalFor && (
        <AttendAppointmentModal
          appointment={attendModalFor.appointment}
          patientName={attendModalFor.patientName}
          onClose={() => setAttendModalFor(null)}
          onSuccess={() => {
            setAttendModalFor(null)
            refreshApi()
          }}
        />
      )}
    </div>
  )
}
