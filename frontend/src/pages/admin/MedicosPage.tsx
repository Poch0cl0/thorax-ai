import { useEffect, useState } from 'react'
import { Stethoscope, Loader2, Edit, Calendar, X } from 'lucide-react'
import * as medicosService from '../../services/medicosService'
import { Link } from 'react-router-dom'

export function MedicosPage() {
  const [medicos, setMedicos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMedico, setEditingMedico] = useState<any | null>(null)
  const [formData, setFormData] = useState({ cmp: '', especialidad: '' })

  async function load() {
    setLoading(true)
    try {
      const data = await medicosService.listMedicos()
      setMedicos(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingMedico) return
    try {
      await medicosService.updateMedico(editingMedico.id, formData)
      setEditingMedico(null)
      void load()
    } catch (err) {
      alert('Error al actualizar médico')
    }
  }

  function openEdit(med: any) {
    setEditingMedico(med)
    setFormData({ cmp: med.cmp || '', especialidad: med.especialidad || '' })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-thorax-text">Gestión de Médicos</h1>
        <p className="mt-2 text-sm text-thorax-muted">Administra los especialistas, su colegiatura y accede a sus agendas.</p>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-thorax-accent" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {medicos.map((med) => (
            <div key={med.id} className="flex flex-col rounded-xl border border-thorax-border bg-thorax-card p-6">
              <div className="flex items-center gap-3 border-b border-thorax-border/50 pb-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-thorax-bg-deep ring-1 ring-thorax-border">
                  <Stethoscope className="h-5 w-5 text-thorax-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-thorax-text">{med.usuario?.nombre_completo || 'Sin Nombre'}</h3>
                  <p className="text-sm text-thorax-muted">{med.especialidad}</p>
                </div>
              </div>
              
              <div className="mt-4 flex-1 space-y-2 text-sm">
                <div className="flex justify-between text-thorax-text">
                  <span className="text-thorax-muted">CMP:</span>
                  <span className="font-medium">{med.cmp || 'No asignado'}</span>
                </div>
                <div className="flex justify-between text-thorax-text">
                  <span className="text-thorax-muted">Email:</span>
                  <span>{med.usuario?.email}</span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-thorax-border/50 grid grid-cols-2 gap-2">
                <button onClick={() => openEdit(med)} className="flex items-center justify-center gap-2 rounded-lg bg-thorax-bg-deep py-2 text-xs font-semibold text-thorax-text hover:bg-thorax-card-alt border border-thorax-border">
                  <Edit className="h-3 w-3" />
                  Editar
                </button>
                <Link to="/agenda" className="flex items-center justify-center gap-2 rounded-lg bg-thorax-accent/10 text-thorax-accent py-2 text-xs font-semibold hover:bg-thorax-accent/20 border border-thorax-accent/20">
                  <Calendar className="h-3 w-3" />
                  Agenda
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingMedico && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-thorax-border bg-thorax-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-thorax-border/60 pb-4">
              <h2 className="text-xl font-bold text-thorax-text">Editar Médico</h2>
              <button onClick={() => setEditingMedico(null)} className="text-thorax-muted hover:text-thorax-text">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-thorax-muted">CMP</label>
                <input required type="text" value={formData.cmp} onChange={e => setFormData({...formData, cmp: e.target.value})} className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent focus:ring-1 focus:ring-thorax-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-thorax-muted">Especialidad</label>
                <input required type="text" value={formData.especialidad} onChange={e => setFormData({...formData, especialidad: e.target.value})} className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent focus:ring-1 focus:ring-thorax-accent" />
              </div>
              
              <div className="mt-8 flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setEditingMedico(null)} className="rounded-lg border border-thorax-border bg-transparent px-4 py-2 text-sm font-medium text-thorax-text hover:bg-thorax-card-alt">
                  Cancelar
                </button>
                <button type="submit" className="rounded-lg bg-thorax-accent px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-thorax-accent-hover">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
