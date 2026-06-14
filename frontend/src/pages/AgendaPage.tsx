import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock, Plus, Loader2, Trash2, Edit, X } from 'lucide-react'
import * as agendaService from '../services/agendaService'
import * as medicosService from '../services/medicosService'
import { useAuth } from '../context/useAuth'
import { isAdminUser } from '../services/clinicalRepository'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

type Slot = {
  id: number
  medico_id: number
  fecha: string
  hora_inicio: string
  hora_fin: string
  disponible: boolean
}

const emptyForm = {
  fecha: '',
  hora_inicio: '',
  hora_fin: '',
  disponible: true,
}

export function AgendaPage() {
  const { user } = useAuth()
  const isAdmin = isAdminUser(user)
  const [medicos, setMedicos] = useState<any[]>([])
  const [selectedMedicoId, setSelectedMedicoId] = useState<number | null>(user?.medico_id ?? null)
  const [items, setItems] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Slot | null>(null)

  const effectiveMedicoId = user?.medico_id ?? selectedMedicoId

  useEffect(() => {
    if (isAdmin && !user?.medico_id) {
      medicosService.listMedicos()
        .then((rows) => {
          setMedicos(rows)
          if (rows.length > 0 && !selectedMedicoId) {
            setSelectedMedicoId(rows[0].id)
          }
        })
        .catch(console.error)
    }
  }, [isAdmin, user?.medico_id, selectedMedicoId])

  async function load() {
    if (!effectiveMedicoId) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await agendaService.listDisponibilidad({ medico_id: effectiveMedicoId })
      setItems(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [effectiveMedicoId])

  const medicoLabel = useMemo(() => {
    if (!effectiveMedicoId) return ''
    const m = medicos.find((x) => x.id === effectiveMedicoId)
    return m?.usuario?.nombre_completo ?? `Médico #${effectiveMedicoId}`
  }, [effectiveMedicoId, medicos])

  function openNew() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
    setShowForm(true)
  }

  function openEdit(item: Slot) {
    setEditingId(item.id)
    setForm({
      fecha: item.fecha?.slice(0, 10) ?? '',
      hora_inicio: item.hora_inicio?.slice(0, 5) ?? '',
      hora_fin: item.hora_fin?.slice(0, 5) ?? '',
      disponible: item.disponible,
    })
    setError(null)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!effectiveMedicoId) return
    setBusy(true)
    setError(null)
    try {
      const payload = {
        medico_id: effectiveMedicoId,
        fecha: form.fecha,
        hora_inicio: form.hora_inicio,
        hora_fin: form.hora_fin,
        disponible: form.disponible,
      }
      if (editingId) {
        await agendaService.updateDisponibilidad(editingId, payload)
      } else {
        await agendaService.createDisponibilidad(payload)
      }
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await agendaService.deleteDisponibilidad(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-thorax-text">Agenda y Disponibilidad</h1>
          <p className="mt-2 text-sm text-thorax-muted">
            {isAdmin && !user?.medico_id
              ? 'Gestione la disponibilidad de los médicos del sistema.'
              : 'Administra tus horarios de atención médica.'}
          </p>
        </div>
        <button
          onClick={openNew}
          disabled={!effectiveMedicoId}
          className="inline-flex items-center gap-2 rounded-xl bg-thorax-accent px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-thorax-accent-hover disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Nueva Disponibilidad
        </button>
      </div>

      {isAdmin && !user?.medico_id && (
        <div className="rounded-xl border border-thorax-border bg-thorax-card p-4">
          <label className="block text-sm font-medium text-thorax-muted mb-2">Médico</label>
          <select
            value={selectedMedicoId ?? ''}
            onChange={(e) => setSelectedMedicoId(Number(e.target.value))}
            className="w-full max-w-md rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text"
          >
            {medicos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.usuario?.nombre_completo ?? `Médico #${m.id}`} — {m.especialidad}
              </option>
            ))}
          </select>
          {medicoLabel && (
            <p className="mt-2 text-xs text-thorax-muted">Mostrando agenda de: {medicoLabel}</p>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-thorax-accent" />
        </div>
      ) : !effectiveMedicoId ? (
        <div className="rounded-xl border border-dashed border-thorax-border/60 bg-thorax-card-alt/60 px-4 py-10 text-center text-sm text-thorax-muted">
          Seleccione un médico para ver su agenda.
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-thorax-border/60 bg-thorax-card-alt/60 px-4 py-10 text-center text-sm text-thorax-muted">
          No hay horarios registrados.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-thorax-border bg-thorax-card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-thorax-text font-medium">
                  <CalendarDays className="h-4 w-4 text-thorax-accent" />
                  {new Date(item.fecha).toLocaleDateString('es-PE')}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(item)} className="text-thorax-muted hover:text-thorax-accent p-1">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(item)} className="text-red-400 hover:text-red-300 p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-thorax-muted">
                <Clock className="h-4 w-4" />
                {item.hora_inicio?.slice(0, 5)} – {item.hora_fin?.slice(0, 5)}
              </div>
              <p className="mt-2 text-xs text-thorax-muted">
                {item.disponible ? 'Disponible' : 'No disponible'}
              </p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-thorax-border bg-thorax-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-thorax-text">{editingId ? 'Editar' : 'Nueva'} disponibilidad</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-thorax-muted" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-thorax-muted">Fecha</label>
                <input type="date" required value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-thorax-muted">Hora inicio</label>
                  <input type="time" required value={form.hora_inicio} onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text" />
                </div>
                <div>
                  <label className="text-xs text-thorax-muted">Hora fin</label>
                  <input type="time" required value={form.hora_fin} onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-thorax-text">
                <input type="checkbox" checked={form.disponible} onChange={(e) => setForm({ ...form, disponible: e.target.checked })} />
                Disponible para citas
              </label>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-thorax-border px-4 py-2 text-sm">Cancelar</button>
                <button type="submit" disabled={busy} className="rounded-lg bg-thorax-accent px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60">
                  {busy ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        title="Eliminar disponibilidad"
        message="¿Está seguro de eliminar este horario?"
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
