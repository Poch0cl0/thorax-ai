import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Calendar,
  Clock,
  Activity,
  Users,
  Shield,
  UserPlus
} from 'lucide-react'
import { useClinicalViewModel } from '../hooks/useClinicalViewModel'
import { StatCard } from '../components/ui/StatCard'
import { useAuth } from '../context/useAuth'
import { mapUserRoleToAppRole } from '../services/clinicalRepository'
import { useEffect, useState } from 'react'
import { listUsers } from '../services/adminService'

function AdminDashboard({ vm }: { vm: any }) {
  const [usersCount, setUsersCount] = useState(0)
  
  useEffect(() => {
    listUsers().then(u => setUsersCount(u.length)).catch(console.error)
  }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-thorax-text">Dashboard Administrador</h1>
        <p className="mt-2 text-sm text-thorax-muted">Vista global de métricas del sistema.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Usuarios Registrados" value={usersCount} icon={Shield} />
        <StatCard label="Pacientes" value={vm.patients.length} icon={Users} />
        <StatCard label="Citas del Día" value={vm.appointments.length} icon={Calendar} variant="accent" />
        <StatCard label="Predicciones" value={vm.predictions.length} icon={Activity} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-thorax-border bg-thorax-card p-6">
           <h2 className="text-lg font-semibold text-thorax-text mb-4">Módulos Administrativos</h2>
           <div className="grid grid-cols-2 gap-4">
              <Link to="/users" className="flex items-center gap-3 p-4 rounded-xl border border-thorax-border hover:border-thorax-accent">
                <Users className="text-thorax-accent h-5 w-5"/> Usuarios
              </Link>
              <Link to="/roles" className="flex items-center gap-3 p-4 rounded-xl border border-thorax-border hover:border-thorax-accent">
                <Shield className="text-thorax-accent h-5 w-5"/> Roles
              </Link>
           </div>
        </div>
      </div>
    </div>
  )
}

function SecretariaDashboard({ vm }: { vm: any }) {
  const upcoming = [...vm.appointments]
    .filter((a: any) => a.status !== 'cancelado')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 5)

  const patientById = new Map<string, any>()
  if (vm) {
    vm.patients.forEach((p: any) => patientById.set(p.id, p))
  }
  const recent = [...vm.patients].slice(-5).reverse()

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-thorax-text">Dashboard</h1>
        <p className="mt-2 text-sm text-thorax-muted">Gestión de citas y pacientes</p>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <Link to="/patients" className="flex items-center justify-center gap-2 rounded-xl bg-thorax-bg-deep border border-thorax-accent/30 px-4 py-4 text-center text-sm font-semibold text-thorax-text hover:bg-thorax-card">
          <UserPlus className="h-5 w-5 text-thorax-accent" /> Nuevo Paciente
        </Link>
        <Link to="/appointments" className="flex items-center justify-center gap-2 rounded-xl bg-thorax-accent px-4 py-4 text-center text-sm font-semibold text-slate-900 shadow hover:bg-thorax-accent-hover">
          <Calendar className="h-5 w-5" /> Nueva Cita
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-thorax-border bg-thorax-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-thorax-text">Próximas citas</h2>
            <Link to="/appointments" className="text-sm font-medium text-thorax-accent hover:underline">Ver todas</Link>
          </div>
          <ul className="space-y-4">
            {upcoming.map((a: any) => {
              const p = patientById.get(a.patient_id)
              const t = new Date(a.scheduled_at)
              return (
                <li key={a.id} className="flex items-start gap-3 border-b border-thorax-border/60 pb-3 last:border-0 last:pb-0">
                  <Calendar className="mt-0.5 h-4 w-4 text-thorax-accent" />
                  <div>
                    <p className="font-medium text-thorax-text">{p ? `${p.nombres} ${p.apellidos}` : 'Paciente'}</p>
                    <p className="text-sm text-thorax-muted">{t.toLocaleString()}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
        <div className="rounded-xl border border-thorax-border bg-thorax-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-thorax-text">Últimos Pacientes</h2>
          </div>
          <ul className="space-y-4">
            {recent.map((p: any) => (
              <li key={p.id} className="flex items-start gap-3 border-b border-thorax-border/60 pb-3 last:border-0 last:pb-0">
                <Users className="mt-0.5 h-4 w-4 text-thorax-accent" />
                <div>
                  <p className="font-medium text-thorax-text">{p.nombres} {p.apellidos}</p>
                  <p className="text-sm text-thorax-muted">{p.dni}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function MedicoDashboard({ vm }: { vm: any }) {
  const pending = vm.appointments.filter((a: any) => a.status === 'programada' || a.status === 'pendiente').slice(0, 5)
  const patientById = new Map(vm.patients.map((p: any) => [p.id, p]))

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-thorax-text">Dashboard Médico</h1>
        <p className="mt-2 text-sm text-thorax-muted">Bienvenido. Revisa tus citas pendientes y alertas.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Citas Pendientes" value={pending.length} icon={Clock} variant="accent" />
        <StatCard label="Pacientes Atendidos" value={vm.patients.length} icon={Users} />
        <StatCard label="Alertas de Riesgo" value={vm.predictions.filter((p: any) => p.risk_level === 'Alto').length} icon={AlertCircle} variant="danger" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_minmax(0,1fr)]">
        <div className="rounded-xl border border-thorax-border bg-thorax-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-thorax-text">Citas de Hoy (Pendientes)</h2>
            <Link to="/attend-queue" className="text-sm font-medium text-thorax-accent hover:underline">Ver fila completa</Link>
          </div>
          <ul className="space-y-4">
            {pending.map((a: any) => {
              const p = patientById.get(a.patient_id)
              return (
                <li key={a.id} className="flex items-center justify-between rounded-xl border border-thorax-border bg-thorax-bg-deep p-4">
                  <div>
                    <p className="font-semibold text-thorax-text">{p ? `${p.nombres} ${p.apellidos}` : 'Paciente'}</p>
                    <p className="mt-1 text-xs text-thorax-muted">
                      DNI: {p?.dni ?? '—'} | {new Date(a.scheduled_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <Link to={`/attend-queue`} className="text-sm text-thorax-accent hover:underline">Atender</Link>
                </li>
              )
            })}
          </ul>
        </div>
        <div className="space-y-6">
           <div className="rounded-xl border border-thorax-border bg-thorax-card p-6">
             <h2 className="text-lg font-semibold text-thorax-text">Predicciones Críticas</h2>
             <div className="mt-4 flex flex-col gap-3">
               {vm.predictions.filter((p: any) => p.risk_level === 'Alto').slice(0, 3).map((p: any) => (
                 <div key={p.id} className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium">
                   <AlertCircle className="h-5 w-5 text-red-400" />
                   Paciente ID: {p.patient_id} - {p.disease_class}
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { vm, loading } = useClinicalViewModel()
  const { user, effectiveApiRole } = useAuth()
  const role = user ? mapUserRoleToAppRole(user.email, user.role, effectiveApiRole) : 'especialista'

  if (loading || !vm) {
    return (
      <div className="rounded-xl border border-thorax-border bg-thorax-card p-8 text-thorax-muted">
        Cargando panel…
      </div>
    )
  }

  if (role === 'admin') return <AdminDashboard vm={vm} />
  if (role === 'secretaria') return <SecretariaDashboard vm={vm} />
  return <MedicoDashboard vm={vm} />
}
