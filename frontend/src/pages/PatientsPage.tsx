import { useMemo, useState } from 'react'
import { ArrowRight, Search, Plus, Edit, Trash2, Eye } from 'lucide-react'
import { useClinicalViewModel } from '../hooks/useClinicalViewModel'
import { patientAgeYears } from '../utils/age'
import { patientRowStatus } from '../utils/clinicalStats'
import { AppBadge } from '../components/ui/AppBadge'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { mapUserRoleToAppRole } from '../services/clinicalRepository'
import * as clinicalService from '../services/clinicalService'
import { PatientFormModal, type PatientFormData } from '../features/patients/PatientFormModal'
import { PatientDetailModal } from '../features/patients/PatientDetailModal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import type { PatientRecord } from '../types/clinical-domain'

const emptyForm: PatientFormData = {
  dni: '',
  nombres: '',
  apellidos: '',
  fecha_nacimiento: '',
  sexo: 'Masculino',
  telefono: '',
  email: '',
  direccion: '',
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length <= 1) return { nombres: parts[0] ?? '', apellidos: '' }
  return { nombres: parts[0], apellidos: parts.slice(1).join(' ') }
}

export function PatientsPage() {
  const { vm, loading, refreshApi } = useClinicalViewModel()
  const { user, effectiveApiRole } = useAuth()
  const appRole = user ? mapUserRoleToAppRole(user.email, user.role, effectiveApiRole) : 'especialista'
  const isMedico = appRole === 'especialista'
  const [query, setQuery] = useState('')

  const [showFormModal, setShowFormModal] = useState(false)
  const [detailPatient, setDetailPatient] = useState<PatientRecord | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<PatientFormData>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<PatientRecord | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!vm) return []
    const q = query.trim().toLowerCase()
    if (!q) return vm.patients
    return vm.patients.filter((p) => {
      const blob = [p.full_name, p.dni ?? '', p.email ?? ''].join(' ').toLowerCase()
      return blob.includes(q)
    })
  }, [vm, query])

  if (loading || !vm) {
    return (
      <div className="rounded-xl border border-thorax-border bg-thorax-card p-8 text-thorax-muted">
        Cargando pacientes…
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (formData.dni && !/^\d{8}$/.test(formData.dni)) {
        throw new Error('DNI debe tener 8 dígitos numéricos.')
      }

      if (editingId) {
        await clinicalService.updatePatient(Number(editingId), formData)
      } else {
        await clinicalService.createPatient(formData)
      }

      setShowFormModal(false)
      setEditingId(null)
      setFormData(emptyForm)
      await refreshApi()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleteBusy(true)
    setDeleteError(null)
    try {
      await clinicalService.deletePatient(Number(deleteTarget.id))
      setDeleteTarget(null)
      await refreshApi()
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Error al eliminar paciente')
    } finally {
      setDeleteBusy(false)
    }
  }

  async function handleEdit(p: PatientRecord) {
    setEditingId(p.id)
    setError(null)
    try {
      const raw = await clinicalService.getPatient(Number(p.id))
      setFormData({
        dni: raw.dni ?? '',
        nombres: raw.nombres,
        apellidos: raw.apellidos,
        fecha_nacimiento: raw.fecha_nacimiento ?? '',
        sexo: raw.sexo ?? 'Masculino',
        telefono: raw.telefono ?? '',
        email: raw.email ?? '',
        direccion: raw.direccion ?? '',
      })
    } catch {
      const { nombres, apellidos } = splitFullName(p.full_name)
      setFormData({
        dni: p.dni ?? '',
        nombres,
        apellidos,
        fecha_nacimiento: p.birth_date ?? '',
        sexo: p.gender ?? 'Masculino',
        telefono: p.phone ?? '',
        email: p.email ?? '',
        direccion: p.address ?? '',
      })
    }
    setShowFormModal(true)
  }

  function handleNew() {
    setEditingId(null)
    setFormData(emptyForm)
    setError(null)
    setShowFormModal(true)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-thorax-text">Gestión de Pacientes</h1>
          <p className="mt-2 text-sm text-thorax-muted">
            {isMedico ? 'Pacientes asignados a sus citas.' : 'Consulta y gestiona todos tus pacientes.'}
          </p>
        </div>
        {!isMedico && (
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-2 rounded-xl bg-thorax-accent px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-thorax-accent-hover"
        >
          <Plus className="h-4 w-4" />
          Nuevo Paciente
        </button>
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-thorax-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, DNI o email…"
          className="w-full rounded-xl border border-thorax-border bg-thorax-card py-3 pl-10 pr-4 text-sm text-thorax-text placeholder:text-thorax-muted outline-none ring-thorax-accent focus:ring-1"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-thorax-border bg-thorax-card">
        <div className="thorax-scroll max-w-full overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-thorax-border bg-thorax-bg-deep/80 text-thorax-muted">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">DNI</th>
                <th className="px-4 py-3 font-medium">Edad</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const age = patientAgeYears(p.birth_date)
                const st = patientRowStatus(vm, p.id)
                return (
                  <tr key={p.id} className="border-b border-thorax-border/60 last:border-0 hover:bg-thorax-bg-deep/40">
                    <td className="px-4 py-4">
                      <p className="font-medium text-thorax-text">{p.full_name}</p>
                      <p className="text-xs text-thorax-muted">{p.email ?? ''}</p>
                    </td>
                    <td className="px-4 py-4 text-thorax-text">{p.dni ?? '—'}</td>
                    <td className="px-4 py-4 text-thorax-muted">{age != null ? `${age} años` : '—'}</td>
                    <td className="max-w-[200px] truncate px-4 py-4 text-thorax-muted">{p.phone ?? '—'}</td>
                    <td className="px-4 py-4">
                      <AppBadge variant={st.kind === 'done' ? 'success' : st.kind === 'pending' ? 'warning' : 'neutral'}>
                        {st.label}
                      </AppBadge>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setDetailPatient(p)}
                        className="p-1.5 text-thorax-muted hover:bg-thorax-bg-deep rounded mr-1"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!isMedico && (
                      <>
                      <button onClick={() => void handleEdit(p)} className="p-1.5 text-thorax-accent hover:bg-thorax-accent/10 rounded mr-1">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError(null)
                          setDeleteTarget(p)
                        }}
                        className="p-1.5 text-red-400 hover:bg-red-400/10 rounded mr-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      </>
                      )}
                      <Link
                        to={`/patients/${p.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-thorax-border text-thorax-accent hover:bg-thorax-bg-deep"
                        aria-label="Ver perfil"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="p-6 text-sm text-thorax-muted">No hay pacientes que coincidan con la búsqueda.</p>
        )}
      </div>

      <PatientFormModal
        open={showFormModal}
        title={editingId ? 'Editar Paciente' : 'Nuevo Paciente'}
        formData={formData}
        busy={busy}
        error={error}
        onClose={() => setShowFormModal(false)}
        onChange={setFormData}
        onSubmit={handleSubmit}
      />

      <PatientDetailModal
        open={detailPatient != null}
        patient={detailPatient}
        onClose={() => setDetailPatient(null)}
      />

      <ConfirmDialog
        open={deleteTarget != null}
        title="Eliminar paciente"
        message={
          deleteTarget
            ? `¿Está seguro de eliminar a ${deleteTarget.full_name}? Se borrarán también sus datos asociados. Esta acción no se puede deshacer.`
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
        onConfirm={() => void handleDeleteConfirm()}
      />
    </div>
  )
}
