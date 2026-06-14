import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { User, Activity, Calendar, History, ArrowLeft, Loader2, FileText } from 'lucide-react'
import { apiFetch } from '../services/api'
import { AppBadge } from '../components/ui/AppBadge'
import { useAuth } from '../context/useAuth'
import { mapUserRoleToAppRole } from '../services/clinicalRepository'
import { ClinicalDataDisplay } from '../features/clinical/ClinicalDataDisplay'

export function PatientProfilePage() {
  const { id } = useParams()
  const { user, effectiveApiRole } = useAuth()
  const appRole = user ? mapUserRoleToAppRole(user.email, user.role, effectiveApiRole) : 'especialista'
  const isSecretaria = appRole === 'secretaria'
  const isMedico = appRole === 'especialista'
  const [patientData, setPatientData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('datos')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const data = await apiFetch<any>(`/api/v1/pacientes/${id}/historial`)
      setPatientData(data)
    } catch (e) {
      console.error(e)
      try {
        const paciente = await apiFetch<any>(`/api/v1/pacientes/${id}`)
        const citas = await apiFetch<any[]>(`/api/v1/citas?paciente_id=${id}`)
        setPatientData({
          paciente,
          citas,
          datos_clinicos: [],
          predicciones: [],
          recomendaciones: [],
        })
      } catch (fallbackErr) {
        console.error(fallbackErr)
        setPatientData(null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) void load()
  }, [id])

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

  const tabs = isSecretaria
    ? [
        { id: 'datos', label: 'Datos Personales', icon: User },
        { id: 'citas', label: 'Citas', icon: Calendar },
      ]
    : isMedico
      ? [
          { id: 'datos', label: 'Datos Personales', icon: User },
          { id: 'historial', label: 'Historial Clínico', icon: History },
          { id: 'citas', label: 'Citas', icon: Calendar },
          { id: 'predicciones', label: 'Predicciones', icon: Activity },
        ]
      : [
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

        {activeTab === 'historial' && !isSecretaria && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-thorax-text mb-4">Historial Clínico</h3>
            {datos_clinicos?.length === 0 && <p className="text-thorax-muted">No hay historial clínico registrado.</p>}
            {datos_clinicos?.map((dc: Record<string, unknown>) => (
              <div key={String(dc.id)} className="p-4 border border-thorax-border rounded-xl bg-thorax-bg-deep">
                <ClinicalDataDisplay
                  data={dc}
                  title=""
                  showDate
                />
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
                <AppBadge variant={c.estado === 'atendida' ? 'success' : c.estado === 'cancelada' ? 'danger' : 'warning'}>
                  {(c.estado ?? 'pendiente').toUpperCase()}
                </AppBadge>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'predicciones' && !isSecretaria && (
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

        {activeTab === 'recomendaciones' && !isSecretaria && !isMedico && (
          <div className="space-y-3">
            {recomendaciones?.length === 0 && <p className="text-thorax-muted">No hay recomendaciones IA generadas.</p>}
            {recomendaciones?.map((r: any) => (
              <div key={r.id} className="p-4 border border-thorax-border rounded-xl bg-thorax-bg-deep">
                <p className="text-xs text-thorax-muted mb-2">{new Date(r.fecha_generacion ?? r.created_at).toLocaleString()}</p>
                <p className="text-sm text-thorax-text whitespace-pre-wrap">{r.contenido_recomendacion ?? r.contenido_markdown}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
