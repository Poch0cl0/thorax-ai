import { useMemo, useState } from 'react'
import { ArrowRight, Search, Plus, X, Edit, Trash2 } from 'lucide-react'
import { useClinicalViewModel } from '../hooks/useClinicalViewModel'
import { patientAgeYears } from '../utils/age'
import { patientRowStatus } from '../utils/clinicalStats'
import { AppBadge } from '../components/ui/AppBadge'
import { Link } from 'react-router-dom'
import * as clinicalService from '../services/clinicalService'

export function PatientsPage() {
  const { vm, loading, refreshApi } = useClinicalViewModel()
  const [query, setQuery] = useState('')
  
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    sexo: 'M',
    telefono: '',
    email: '',
    direccion: ''
  })

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
      
      setShowModal(false)
      setEditingId(null)
      setFormData({ dni: '', nombres: '', apellidos: '', fecha_nacimiento: '', sexo: 'M', telefono: '', email: '', direccion: '' })
      await refreshApi()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Seguro que quieres eliminar este paciente? (Esta acción no se puede deshacer)')) return
    try {
      await clinicalService.deletePatient(Number(id))
      await refreshApi()
    } catch (e) {
      alert('Error al eliminar paciente')
    }
  }

  function handleEdit(p: any) {
    setEditingId(p.id)
    setFormData({
      dni: p.dni || '',
      nombres: p.nombres || '',
      apellidos: p.apellidos || '',
      fecha_nacimiento: p.fecha_nacimiento || '',
      sexo: p.sexo || 'M',
      telefono: p.telefono || '',
      email: p.email || '',
      direccion: p.direccion || ''
    })
    setShowModal(true)
  }

  function handleNew() {
    setEditingId(null)
    setFormData({ dni: '', nombres: '', apellidos: '', fecha_nacimiento: '', sexo: 'M', telefono: '', email: '', direccion: '' })
    setShowModal(true)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-thorax-text">Gestión de Pacientes</h1>
          <p className="mt-2 text-sm text-thorax-muted">Consulta y gestiona todos tus pacientes.</p>
        </div>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-2 rounded-xl bg-thorax-accent px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-thorax-accent-hover"
        >
          <Plus className="h-4 w-4" />
          Nuevo Paciente
        </button>
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
                      <button onClick={() => handleEdit(p)} className="p-1.5 text-thorax-accent hover:bg-thorax-accent/10 rounded mr-1">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded mr-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-thorax-border bg-thorax-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-thorax-border/60 pb-4">
              <h2 className="text-xl font-bold text-thorax-text">{editingId ? 'Editar' : 'Nuevo'} Paciente</h2>
              <button onClick={() => setShowModal(false)} className="text-thorax-muted hover:text-thorax-text">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-thorax-muted">Nombres</label>
                  <input required value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-thorax-muted">Apellidos</label>
                  <input required value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})} className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-thorax-muted">DNI</label>
                  <input required maxLength={8} value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-thorax-muted">Fecha de Nacimiento</label>
                  <input required type="date" value={formData.fecha_nacimiento} onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})} className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-thorax-muted">Sexo</label>
                  <select required value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})} className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent outline-none">
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-thorax-muted">Teléfono</label>
                  <input value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-thorax-muted">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-thorax-muted">Dirección</label>
                  <input value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent outline-none" />
                </div>
              </div>

              {error && <p className="text-sm text-red-400 mt-2">{error}</p>}

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-thorax-border/60">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-thorax-border px-4 py-2 text-sm font-medium text-thorax-text hover:bg-thorax-card-alt">Cancelar</button>
                <button type="submit" disabled={busy} className="rounded-lg bg-thorax-accent px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-thorax-accent-hover disabled:opacity-60">
                  {busy ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
