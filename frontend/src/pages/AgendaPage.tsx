import { useEffect, useState } from 'react'
import { CalendarDays, Clock, Plus, Loader2, Trash2 } from 'lucide-react'
import * as agendaService from '../services/agendaService'
import * as medicosService from '../services/medicosService'
import { useAuth } from '../context/useAuth'

export function AgendaPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const { user } = useAuth()

  async function load() {
    if (!user) return
    setLoading(true)
    try {
      // Find medico_id for current user
      const medicos = await medicosService.listMedicos()
      const myMedico = medicos.find((m: any) => m.usuario_id === user.id)
      
      let data = []
      if (myMedico) {
        data = await agendaService.listDisponibilidad({ medico_id: myMedico.id })
      } else if (user.role === 'admin' || user.role === 'secretaria') {
        data = await agendaService.listDisponibilidad()
      }
      setItems(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [user])

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-thorax-text">Agenda y Disponibilidad</h1>
          <p className="mt-2 text-sm text-thorax-muted">Administra tus horarios de atención médica.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-thorax-accent px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-thorax-accent-hover"
        >
          <Plus className="h-4 w-4" />
          Nueva Disponibilidad
        </button>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-thorax-accent" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-thorax-border/60 bg-thorax-card-alt/60 px-4 py-10 text-center text-sm text-thorax-muted">
          No hay horarios registrados.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <div key={item.id} className="rounded-xl border border-thorax-border bg-thorax-card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-thorax-text font-medium">
                  <CalendarDays className="h-4 w-4 text-thorax-accent" />
                  {item.dia_semana}
                </div>
                <button className="text-red-400 hover:text-red-300">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-thorax-muted">
                <Clock className="h-4 w-4" />
                {item.hora_inicio} - {item.hora_fin}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
