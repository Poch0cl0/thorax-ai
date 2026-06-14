import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { User, Activity, Calendar, History, ArrowLeft, Loader2, FileText, Plus, X, Save } from 'lucide-react'
import { apiFetch } from '../services/api'
import { AppBadge } from '../components/ui/AppBadge'

export function PatientProfilePage() {
  const { id } = useParams()
  const [patientData, setPatientData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('datos')
  const [loading, setLoading] = useState(true)

  const [showClinicalForm, setShowClinicalForm] = useState(false)
  const [formData, setFormData] = useState({
    peso_kg: '',
    talla_cm: '',
    fumador: false,
    sintomas: '',
    comorbilidades: ''
  })
  const [saving, setSaving] = useState(false)

  async function load() {
      setLoading(true)
      try {
        const data = await apiFetch<any>(`/api/v1/pacientes/${id}/historial`)
        setPatientData(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
    }
  }

  useEffect(() => {
    if (id) void load()
  }, [id])

  async function handleSaveClinicalData(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch(`/api/v1/pacientes/${id}/datos-clinicos`, {
        method: 'POST',
        body: JSON.stringify({
          peso_kg: formData.peso_kg ? Number(formData.peso_kg) : null,
          talla_cm: formData.talla_cm ? Number(formData.talla_cm) : null,
          fumador: formData.fumador,
          sintomas: formData.sintomas || null,
          comorbilidades: formData.comorbilidades || null
        })
      })
      setShowClinicalForm(false)
      setFormData({ peso_kg: '', talla_cm: '', fumador: false, sintomas: '', comorbilidades: '' })
      await load()
    } catch (e) {
      alert('Error al guardar datos clínicos')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-thorax-accent" />
      </div>
    )
  }

  if (!patientData) {
    return <div className="text-thorax-muted p-8">Paciente no encontrado.</div>
  }

  const { paciente, citas, datos_clinicos, predicciones, recomendaciones } = patientData

  const tabs = [
    { id: 'datos', label: 'Datos Personales', icon: User },
    { id: 'historial', label: 'Historial Clínico', icon: History },
    { id: 'citas', label: 'Citas', icon: Calendar },
    { id: 'predicciones', label: 'Predicciones', icon: Activity },
    { id: 'recomendaciones', label: 'Recomendaciones', icon: FileText },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <Link to="/patients" className="inline-flex items-center gap-2 text-sm text-thorax-muted hover:text-thorax-text mb-4">
          <ArrowLeft className="h-4 w-4" /> Volver a Pacientes
        </Link>
        <h1 className="text-3xl font-bold text-thorax-text">{paciente.nombres} {paciente.apellidos}</h1>
        <p className="mt-2 text-sm text-thorax-muted">DNI: {paciente.dni} • Registrado el {new Date(paciente.created_at).toLocaleDateString()}</p>
      </div>

      <div className="flex border-b border-thorax-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-thorax-accent text-thorax-accent' 
                : 'border-transparent text-thorax-muted hover:text-thorax-text hover:border-thorax-border'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-thorax-card rounded-xl border border-thorax-border p-6 min-h-[400px]">
        {activeTab === 'datos' && (
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div><span className="block text-thorax-muted mb-1">Nombres</span><p className="text-thorax-text font-medium">{paciente.nombres}</p></div>
            <div><span className="block text-thorax-muted mb-1">Apellidos</span><p className="text-thorax-text font-medium">{paciente.apellidos}</p></div>
            <div><span className="block text-thorax-muted mb-1">DNI</span><p className="text-thorax-text font-medium">{paciente.dni || '—'}</p></div>
            <div><span className="block text-thorax-muted mb-1">Fecha de Nacimiento</span><p className="text-thorax-text font-medium">{paciente.fecha_nacimiento || '—'}</p></div>
            <div><span className="block text-thorax-muted mb-1">Sexo</span><p className="text-thorax-text font-medium">{paciente.sexo === 'M' ? 'Masculino' : paciente.sexo === 'F' ? 'Femenino' : '—'}</p></div>
            <div><span className="block text-thorax-muted mb-1">Teléfono</span><p className="text-thorax-text font-medium">{paciente.telefono || '—'}</p></div>
            <div><span className="block text-thorax-muted mb-1">Email</span><p className="text-thorax-text font-medium">{paciente.email || '—'}</p></div>
            <div className="col-span-2"><span className="block text-thorax-muted mb-1">Dirección</span><p className="text-thorax-text font-medium">{paciente.direccion || '—'}</p></div>
          </div>
        )}

        {activeTab === 'historial' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-thorax-text">Historial Clínico</h3>
              <button onClick={() => setShowClinicalForm(true)} className="inline-flex items-center gap-2 bg-thorax-accent px-3 py-1.5 text-sm font-semibold text-slate-900 rounded-lg hover:bg-thorax-accent-hover">
                <Plus className="h-4 w-4" /> Nuevo Registro
              </button>
            </div>
            {datos_clinicos?.length === 0 && <p className="text-thorax-muted">No hay historial clínico registrado.</p>}
            {datos_clinicos?.map((dc: any) => (
              <div key={dc.id} className="p-4 border border-thorax-border rounded-xl bg-thorax-bg-deep">
                <p className="text-xs text-thorax-muted mb-2">{new Date(dc.created_at).toLocaleString()}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-thorax-muted">Edad en consulta:</span> {dc.edad}</div>
                  <div><span className="text-thorax-muted">Peso:</span> {dc.peso_kg} kg</div>
                  <div><span className="text-thorax-muted">Talla:</span> {dc.talla_cm} cm</div>
                  <div><span className="text-thorax-muted">Fumador:</span> {dc.fumador ? 'Sí' : 'No'}</div>
                  <div className="col-span-2"><span className="text-thorax-muted">Síntomas:</span> {dc.sintomas || 'Ninguno'}</div>
                  <div className="col-span-2"><span className="text-thorax-muted">Comorbilidades:</span> {dc.comorbilidades || 'Ninguna'}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'citas' && (
          <div className="space-y-3">
            {citas?.length === 0 && <p className="text-thorax-muted">No hay citas registradas.</p>}
            {citas?.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-4 border border-thorax-border rounded-xl bg-thorax-bg-deep">
                <div>
                  <p className="font-medium text-thorax-text">{new Date(c.fecha_cita).toLocaleString()}</p>
                  <p className="text-xs text-thorax-muted mt-1">{c.motivo_consulta || c.observaciones || 'Sin observaciones'}</p>
                </div>
                <AppBadge variant={c.estado === 'atendido' ? 'success' : c.estado === 'cancelado' ? 'danger' : 'warning'}>
                  {c.estado.toUpperCase()}
                </AppBadge>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'predicciones' && (
          <div className="space-y-3">
            {predicciones?.length === 0 && <p className="text-thorax-muted">No hay predicciones IA realizadas.</p>}
            {predicciones?.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-4 border border-thorax-border rounded-xl bg-thorax-bg-deep">
                <div>
                  <p className="font-medium text-thorax-text">{p.clase_predicha} ({(p.probabilidad * 100).toFixed(1)}%)</p>
                  <p className="text-xs text-thorax-muted mt-1">Modelo: {p.modelo_utilizado} • {new Date(p.fecha_prediccion).toLocaleString()}</p>
                </div>
                <AppBadge variant={p.nivel_riesgo === 'Alto' ? 'danger' : 'success'}>
                  Riesgo {p.nivel_riesgo}
                </AppBadge>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'recomendaciones' && (
          <div className="space-y-3">
            {recomendaciones?.length === 0 && <p className="text-thorax-muted">No hay recomendaciones IA generadas.</p>}
            {recomendaciones?.map((r: any) => (
              <div key={r.id} className="p-4 border border-thorax-border rounded-xl bg-thorax-bg-deep">
                <p className="text-xs text-thorax-muted mb-2">{new Date(r.created_at).toLocaleString()}</p>
                <p className="text-sm text-thorax-text whitespace-pre-wrap">{r.contenido_markdown}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showClinicalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-thorax-border bg-thorax-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-thorax-border/60 pb-4">
              <h2 className="text-lg font-bold text-thorax-text">Nuevo Registro Clínico</h2>
              <button onClick={() => setShowClinicalForm(false)} className="text-thorax-muted hover:text-thorax-text">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveClinicalData} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-thorax-muted mb-1">Peso (kg)</label>
                  <input type="number" step="0.1" value={formData.peso_kg} onChange={e => setFormData({...formData, peso_kg: e.target.value})} className="block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-thorax-muted mb-1">Talla (cm)</label>
                  <input type="number" step="0.1" value={formData.talla_cm} onChange={e => setFormData({...formData, talla_cm: e.target.value})} className="block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent outline-none" />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="fumador" checked={formData.fumador} onChange={e => setFormData({...formData, fumador: e.target.checked})} className="rounded border-thorax-border bg-thorax-bg-deep text-thorax-accent focus:ring-thorax-accent" />
                  <label htmlFor="fumador" className="text-sm font-medium text-thorax-text">¿Es fumador?</label>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-thorax-muted mb-1">Síntomas</label>
                  <textarea rows={2} value={formData.sintomas} onChange={e => setFormData({...formData, sintomas: e.target.value})} className="block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-thorax-muted mb-1">Comorbilidades</label>
                  <textarea rows={2} value={formData.comorbilidades} onChange={e => setFormData({...formData, comorbilidades: e.target.value})} className="block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent outline-none" />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-thorax-border/60">
                <button type="button" onClick={() => setShowClinicalForm(false)} className="rounded-lg border border-thorax-border px-4 py-2 text-sm font-medium text-thorax-text hover:bg-thorax-card-alt">Cancelar</button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-thorax-accent px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-thorax-accent-hover disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
