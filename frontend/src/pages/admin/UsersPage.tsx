/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { Users, Loader2, Plus, X, Edit, Trash2 } from 'lucide-react'
import * as adminService from '../../services/adminService'
import { AppBadge } from '../../components/ui/AppBadge'
import { isDoctorRoleName } from '../../services/clinicalRepository'

export function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    username: '',
    password: '',
    rol_id: 0,
    medico_cmp: '',
    medico_especialidad: 'Neumologia',
  })

  async function load() {
    setLoading(true)
    setLoadError(null)
    try {
      const [uData, rData] = await Promise.all([
        adminService.listUsers(),
        adminService.listRoles()
      ])
      setUsers(uData)
      setRoles(rData)
      if (rData.length > 0) setFormData(f => ({ ...f, rol_id: rData[0].id }))
    } catch (e) {
      console.error(e)
      setLoadError(e instanceof Error ? e.message : 'No se pudieron cargar usuarios. Verifique permisos de administrador.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingId) {
        await adminService.updateUser(editingId, formData)
      } else {
        await adminService.createUser(formData)
      }
      setShowModal(false)
      setEditingId(null)
      void load()
    } catch {
      alert('Error al guardar usuario')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Seguro que quieres eliminar este usuario?')) return
    try {
      await adminService.deleteUser(id)
      void load()
    } catch {
      alert('Error al eliminar')
    }
  }

  function handleEdit(user: any) {
    setEditingId(user.id)
    setFormData({
      nombre_completo: user.nombre_completo,
      email: user.email,
      username: user.username,
      password: '',
      rol_id: user.rol_id,
      medico_cmp: '',
      medico_especialidad: 'Neumologia'
    })
    setShowModal(true)
  }

  function handleNew() {
    setEditingId(null)
    setFormData({
      nombre_completo: '',
      email: '',
      username: '',
      password: '',
      rol_id: roles.length > 0 ? roles[0].id : 0,
      medico_cmp: '',
      medico_especialidad: 'Neumologia'
    })
    setShowModal(true)
  }

  const isMedico = isDoctorRoleName(roles.find(r => r.id === formData.rol_id)?.nombre)

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-thorax-text">Gestión de Usuarios</h1>
          <p className="mt-2 text-sm text-thorax-muted">Administra el acceso y roles de los usuarios del sistema.</p>
        </div>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-2 rounded-xl bg-thorax-accent px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-thorax-accent-hover"
        >
          <Plus className="h-4 w-4" />
          Nuevo Usuario
        </button>
      </div>

      {loadError && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{loadError}</p>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-thorax-accent" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-thorax-border bg-thorax-card">
          <table className="w-full text-left text-sm text-thorax-text">
            <thead className="border-b border-thorax-border bg-thorax-card-alt text-xs uppercase text-thorax-muted">
              <tr>
                <th className="px-6 py-4 font-semibold">Usuario</th>
                <th className="px-6 py-4 font-semibold">Username</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Rol</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-thorax-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-thorax-card-alt/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-thorax-bg-deep ring-1 ring-thorax-border">
                        <Users className="h-4 w-4 text-thorax-accent" />
                      </div>
                      <span className="font-medium">{u.nombre_completo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-thorax-muted">{u.username}</td>
                  <td className="px-6 py-4 text-thorax-muted">{u.email}</td>
                  <td className="px-6 py-4">
                    <AppBadge variant="neutral">{u.rol?.nombre?.toUpperCase() ?? '—'}</AppBadge>
                  </td>
                  <td className="px-6 py-4">
                    {u.activo ? (
                      <AppBadge variant="success">Activo</AppBadge>
                    ) : (
                      <AppBadge variant="danger">Inactivo</AppBadge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(u)} className="p-1.5 text-thorax-accent hover:bg-thorax-accent/10 rounded mr-2">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-thorax-border bg-thorax-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-thorax-border/60 pb-4">
              <h2 className="text-xl font-bold text-thorax-text">{editingId ? 'Editar' : 'Nuevo'} Usuario</h2>
              <button onClick={() => setShowModal(false)} className="text-thorax-muted hover:text-thorax-text">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-thorax-muted">Nombre Completo</label>
                <input required type="text" value={formData.nombre_completo} onChange={e => setFormData({...formData, nombre_completo: e.target.value})} className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent focus:ring-1 focus:ring-thorax-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-thorax-muted">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent focus:ring-1 focus:ring-thorax-accent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-thorax-muted">Username</label>
                  <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent focus:ring-1 focus:ring-thorax-accent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-thorax-muted">Contraseña {editingId && '(Dejar en blanco para no cambiar)'}</label>
                  <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent focus:ring-1 focus:ring-thorax-accent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-thorax-muted">Rol</label>
                <select value={formData.rol_id} onChange={e => setFormData({...formData, rol_id: Number(e.target.value)})} className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent focus:ring-1 focus:ring-thorax-accent">
                  {roles.map(r => <option key={r.id} value={r.id}>{r.nombre.toUpperCase()}</option>)}
                </select>
              </div>

              {!editingId && isMedico && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-sm font-medium text-thorax-muted">CMP</label>
                    <input required type="text" value={formData.medico_cmp} onChange={e => setFormData({...formData, medico_cmp: e.target.value})} className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent focus:ring-1 focus:ring-thorax-accent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-thorax-muted">Especialidad</label>
                    <input required type="text" value={formData.medico_especialidad} onChange={e => setFormData({...formData, medico_especialidad: e.target.value})} className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent focus:ring-1 focus:ring-thorax-accent" />
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-thorax-border bg-transparent px-4 py-2 text-sm font-medium text-thorax-text hover:bg-thorax-card-alt">
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
