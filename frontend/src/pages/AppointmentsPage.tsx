import { useState, useEffect } from 'react'
import * as agendaService from '../services/agendaService'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Stethoscope,
  Trash2,
  User,
  Edit,
  Send,
  Loader2,
  Eye,
} from 'lucide-react'
import { useClinicalViewModel } from '../hooks/useClinicalViewModel'
import { useAuth } from '../context/useAuth'
import { mapUserRoleToAppRole } from '../services/clinicalRepository'
import * as clinicalService from '../services/clinicalService'
import type { AppointmentRecord, PatientRecord, SpecialistRecord } from '../types/clinical-domain'
import { AppointmentFormModal, type AvailabilitySlot } from '../features/appointments/AppointmentFormModal'
import { AppointmentDetailModal } from '../features/appointments/AppointmentDetailModal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

function mondayIndex(jsDay: number) {
  const v = jsDay - 1
  return v < 0 ? 6 : v
}

function dateKeyFromScheduledAt(scheduledAt: string): string {
  return scheduledAt.slice(0, 10)
}

function dateKeyFromParts(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function AppointmentsPage() {
  const { vm, loading, mode, refreshApi, createAppointmentDemo } = useClinicalViewModel()
  const { user, effectiveApiRole } = useAuth()
  const appRole = user ? mapUserRoleToAppRole(user.email, user.role, effectiveApiRole) : 'secretaria'
  const showClinicalActions = appRole === 'admin'

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState<number | null>(() => new Date().getDate())

  const [showForm, setShowForm] = useState(false)
  const [detailAppointment, setDetailAppointment] = useState<AppointmentRecord | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [patientId, setPatientId] = useState('')
  const [specialistId, setSpecialistId] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [slotId, setSlotId] = useState('')
  const [notes, setNotes] = useState('')
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [formBusy, setFormBusy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AppointmentRecord | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!specialistId || !dateStr) {
      setAvailableSlots([])
      setSlotId('')
      return
    }
    agendaService
      .listDisponibilidad({ medico_id: Number(specialistId), fecha: dateStr, disponible: true })
      .then((slots) => {
        setAvailableSlots(
          slots.map((s: any) => ({
            id: s.id,
            hora_inicio: s.hora_inicio,
            hora_fin: s.hora_fin,
          })),
        )
      })
      .catch(() => setAvailableSlots([]))
  }, [specialistId, dateStr])

  const calYear = viewMonth.getFullYear()
  const calMonth = viewMonth.getMonth()
  const first = new Date(calYear, calMonth, 1)
  const last = new Date(calYear, calMonth + 1, 0)
  const startPad = mondayIndex(first.getDay())
  const daysInMonth = last.getDate()

  const appointmentsInMonth = !vm
    ? []
    : vm.appointments.filter((a) => {
        const t = new Date(a.scheduled_at)
        return t.getFullYear() === calYear && t.getMonth() === calMonth
      })

  const dotDays = new Set<number>()
  appointmentsInMonth.forEach((a) => dotDays.add(new Date(a.scheduled_at).getDate()))

  const specialistById = new Map<string, SpecialistRecord>(vm ? vm.specialists.map((s) => [s.id, s]) : [])
  const patientById = new Map<string, PatientRecord>(vm ? vm.patients.map((p) => [p.id, p]) : [])

  const listItems = !vm || selectedDay == null
    ? []
    : [...appointmentsInMonth]
        .filter((a) => dateKeyFromScheduledAt(a.scheduled_at) === dateKeyFromParts(calYear, calMonth, selectedDay))
        .sort(
          (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
        )

  const selectedDateLabel =
    selectedDay != null
      ? new Date(calYear, calMonth, selectedDay).toLocaleDateString('es-PE', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : ''

  if (loading || !vm) {
    return (
      <div className="rounded-xl border border-thorax-border bg-thorax-card p-8 text-thorax-muted">
        Cargando citas…
      </div>
    )
  }

  function openNewForm() {
    setEditingId(null)
    setFormError(null)
    setShowForm(true)
    const d = selectedDay != null ? new Date(calYear, calMonth, selectedDay) : new Date()
    setDateStr(d.toISOString().slice(0, 10))
    setSlotId('')
    setNotes('')
    if (vm!.specialists[0]) setSpecialistId(vm!.specialists[0].id)
    if (vm!.patients[0]) setPatientId(vm!.patients[0].id)
  }

  function openEditForm(a: AppointmentRecord) {
    setEditingId(a.id)
    setFormError(null)
    setPatientId(a.patient_id)
    setSpecialistId(a.specialist_id || '')
    const t = new Date(a.scheduled_at)
    setDateStr(t.toISOString().slice(0, 10))
    setNotes(a.notes || '')
    setSlotId('')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId || !specialistId || !dateStr || !slotId) return

    const slot = availableSlots.find((s) => String(s.id) === slotId)
    if (!slot) {
      setFormError('Seleccione un horario válido.')
      return
    }

    const [hh, mm] = slot.hora_inicio.slice(0, 5).split(':').map(Number)
    const scheduledAt = `${dateStr}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`

    setFormBusy(true)
    setFormError(null)

    try {
      if (mode === 'mock') {
        createAppointmentDemo({
          patient_id: patientId,
          specialist_id: specialistId,
          scheduled_at: new Date(scheduledAt).toISOString(),
          notes: notes.trim() || 'Consulta de control',
          status: 'pendiente',
        })
      } else if (editingId) {
        await clinicalService.updateAppointment(Number.parseInt(editingId, 10), {
          attending_user_id: Number.parseInt(specialistId, 10),
          scheduled_at: scheduledAt,
          notes: notes.trim() || null,
          disponibilidad_id: slot.id,
        })
        await refreshApi()
      } else {
        await clinicalService.createAppointment({
          patient_id: Number.parseInt(patientId, 10),
          attending_user_id: Number.parseInt(specialistId, 10),
          scheduled_at: scheduledAt,
          notes: notes.trim() || null,
          status: 'pendiente',
          disponibilidad_id: slot.id,
        })
        await refreshApi()
      }
      setShowForm(false)
      setNotes('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar la cita.')
    } finally {
      setFormBusy(false)
    }
  }

  async function handleDeleteAppointment() {
    if (!deleteTarget) return
    setDeleteBusy(true)
    setDeleteError(null)
    try {
      await clinicalService.deleteAppointment(Number.parseInt(deleteTarget.id, 10))
      setDeleteTarget(null)
      await refreshApi()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'No se pudo eliminar la cita.')
    } finally {
      setDeleteBusy(false)
    }
  }

  const today = new Date()
  const viewingCurrentMonth = today.getFullYear() === calYear && today.getMonth() === calMonth
  const hasAppointmentOnSelectedDay =
    selectedDay != null &&
    appointmentsInMonth.some((a) => dateKeyFromScheduledAt(a.scheduled_at) === dateKeyFromParts(calYear, calMonth, selectedDay))
  const footerText =
    selectedDay != null
      ? hasAppointmentOnSelectedDay
        ? `Citas programadas para el ${selectedDay} de ${MONTHS[calMonth].toLowerCase()}`
        : `Sin citas el ${selectedDay} de ${MONTHS[calMonth].toLowerCase()}`
      : viewingCurrentMonth
        ? 'Seleccione un día del calendario'
        : 'Los días con cita muestran un indicador bajo el número'

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-thorax-text">Gestión de Citas</h1>
        <p className="mt-2 text-sm text-thorax-muted">Programa y gestiona las citas de los pacientes.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-thorax-border bg-thorax-card p-5">
          <div className="flex items-center justify-between">
            <button type="button" aria-label="Mes anterior" className="rounded-lg p-2 text-thorax-muted hover:bg-thorax-bg-deep hover:text-thorax-text" onClick={() => { setViewMonth((d) => addMonths(d, -1)); setSelectedDay(1) }}>
              <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <p className="text-sm font-semibold capitalize text-thorax-text">{MONTHS[calMonth]} {calYear}</p>
            <button type="button" aria-label="Mes siguiente" className="rounded-lg p-2 text-thorax-muted hover:bg-thorax-bg-deep hover:text-thorax-text" onClick={() => { setViewMonth((d) => addMonths(d, 1)); setSelectedDay(1) }}>
              <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-thorax-muted">
            {WEEKDAYS.map((d) => (<div key={d} className="py-2 font-medium">{d}</div>))}
            {Array.from({ length: startPad }).map((_, i) => (<div key={`pad-${i}`} />))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const isSel = selectedDay === day
              const hasDot = dotDays.has(day)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={[
                    'relative flex flex-col items-center justify-center rounded-lg py-2 text-sm font-medium transition-colors',
                    isSel ? 'bg-thorax-accent text-slate-900' : 'text-thorax-text hover:bg-thorax-bg-deep',
                  ].join(' ')}
                >
                  {day}
                  {hasDot && (
                    <span className={['mt-1 block h-1.5 w-1.5 rounded-full', isSel ? 'bg-slate-900' : 'bg-thorax-accent'].join(' ')} />
                  )}
                </button>
              )
            })}
          </div>
          <p className="mt-4 text-center text-xs text-thorax-muted">{footerText}</p>
        </div>

        <div className="flex flex-col rounded-xl border border-thorax-border bg-thorax-card">
          <div className="flex items-center justify-between border-b border-thorax-border px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-thorax-text">Citas</h2>
              {selectedDay != null && (
                <p className="mt-0.5 text-xs capitalize text-thorax-muted">{selectedDateLabel}</p>
              )}
            </div>
            <button type="button" onClick={openNewForm} className="inline-flex items-center gap-2 rounded-xl bg-thorax-accent px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-thorax-accent-hover">
              + Nueva Cita
            </button>
          </div>
          <ul className="thorax-scroll max-h-[420px] divide-y divide-thorax-border/60 overflow-y-auto px-5 py-3">
            {listItems.map((a) => {
              const p = patientById.get(a.patient_id)
              const sp = a.specialist_id ? specialistById.get(a.specialist_id) : undefined
              const t = new Date(a.scheduled_at)
              const isPending = a.status === 'pendiente'
              return (
                <li key={a.id} className="flex gap-3 py-4 first:pt-0">
                  <div className="min-w-0 flex-1 space-y-2 text-sm">
                    <p className="flex items-center gap-2 font-medium text-thorax-text">
                      <User className="h-4 w-4 shrink-0 text-thorax-accent" strokeWidth={1.75} />
                      {p?.full_name ?? 'Paciente'}
                    </p>
                    <p className="flex items-center gap-2 text-thorax-muted">
                      <Clock className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                      {t.toLocaleDateString('es-PE')} — {t.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="flex items-center gap-2 text-xs text-thorax-muted">
                      <Stethoscope className="h-4 w-4 shrink-0 text-thorax-muted" strokeWidth={1.75} />
                      {a.notes ?? 'Consulta'} • {sp?.display_name ?? 'Sin asignar'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start">
                    <button type="button" className="text-thorax-muted hover:text-thorax-text" title="Ver detalle" onClick={() => setDetailAppointment(a)}>
                      <Eye className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                    {mode === 'api' && isPending && (
                      <>
                        <button type="button" className="text-thorax-muted hover:text-thorax-accent" title="Editar cita" onClick={() => openEditForm(a)}>
                          <Edit className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          className="text-thorax-muted hover:text-thorax-danger"
                          title="Eliminar cita pendiente"
                          onClick={() => {
                            setDeleteError(null)
                            setDeleteTarget(a)
                          }}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                      </>
                    )}
                    {showClinicalActions && mode === 'api' && a.status === 'atendida' && a.predicciones && a.predicciones.length > 0 && (
                      <button
                        type="button"
                        className="text-thorax-accent hover:text-thorax-accent-hover disabled:opacity-40"
                        title="Enviar Informe IA"
                        disabled={sendingId === a.id}
                        onClick={() => {
                          const predId = a.predicciones?.[0]?.id
                          if (!predId) return
                          setSendingId(a.id)
                          clinicalService.sendAiDiagnosis(predId)
                            .then(() => alert('Informe IA enviado correctamente al correo.'))
                            .catch(() => alert('Error al enviar informe IA.'))
                            .finally(() => setSendingId(null))
                        }}
                      >
                        {sendingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" strokeWidth={1.75} />}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
            {listItems.length === 0 && (
              <p className="py-8 text-center text-sm text-thorax-muted">
                {selectedDay != null
                  ? `No hay citas el ${selectedDay} de ${MONTHS[calMonth].toLowerCase()} de ${calYear}.`
                  : 'Seleccione un día en el calendario.'}
              </p>
            )}
          </ul>
        </div>
      </div>

      <AppointmentFormModal
        open={showForm}
        editing={editingId != null}
        patients={vm.patients}
        specialists={vm.specialists}
        patientId={patientId}
        specialistId={specialistId}
        dateStr={dateStr}
        slotId={slotId}
        notes={notes}
        availableSlots={availableSlots}
        error={formError}
        busy={formBusy}
        onClose={() => setShowForm(false)}
        onPatientChange={setPatientId}
        onSpecialistChange={(id) => { setSpecialistId(id); setSlotId('') }}
        onDateChange={(d) => { setDateStr(d); setSlotId('') }}
        onSlotChange={setSlotId}
        onNotesChange={setNotes}
        onSubmit={handleSubmit}
      />

      <AppointmentDetailModal
        open={detailAppointment != null}
        appointment={detailAppointment}
        patient={detailAppointment ? patientById.get(detailAppointment.patient_id) : undefined}
        specialist={detailAppointment?.specialist_id ? specialistById.get(detailAppointment.specialist_id) : undefined}
        onClose={() => setDetailAppointment(null)}
      />

      <ConfirmDialog
        open={deleteTarget != null}
        title="Eliminar cita"
        message={
          deleteTarget
            ? `¿Está seguro de eliminar la cita del ${new Date(deleteTarget.scheduled_at).toLocaleString('es-PE')}? Esta acción no se puede deshacer.`
            : ''
        }
        error={deleteError}
        confirmLabel="Sí, eliminar"
        busy={deleteBusy}
        onCancel={() => {
          if (!deleteBusy) {
            setDeleteTarget(null)
            setDeleteError(null)
          }
        }}
        onConfirm={() => void handleDeleteAppointment()}
      />
    </div>
  )
}
