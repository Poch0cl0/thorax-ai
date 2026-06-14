import { useEffect, useState } from 'react'
import { Shield, Loader2, Key, Plus, X } from 'lucide-react'
import * as adminService from '../../services/adminService'
import { AppBadge } from '../../components/ui/AppBadge'

export function RolesPage() {
  const [roles, setRoles] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' })

  const [managingRole, setManagingRole] = useState<any | null>(null)

  async function load() {
    setLoading(true)
    setLoadError(null)
    try {
      const [rData, pData] = await Promise.all([
        adminService.listRoles(),
        adminService.listPermissions()
      ])
      setRoles(rData)
      setPermissions(pData)
    } catch (e) {
      console.error(e)
      setLoadError(e instanceof Error ? e.message : 'No se pudieron cargar roles. Verifique permisos de administrador.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      await adminService.createRole(formData)
      setShowModal(false)
      void load()
    } catch (error) {
      alert('Error al crear rol')
    }
  }

  async function togglePermission(roleId: number, permId: number, hasPerm: boolean) {
    try {
      if (hasPerm) await adminService.removePermission(roleId, permId)
      else await adminService.assignPermission(roleId, permId)
      
      const newRoles = await adminService.listRoles()
      setRoles(newRoles)
      setManagingRole(newRoles.find((r:any) => r.id === roleId))
    } catch (e) {
      alert("Error al actualizar permiso")
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-thorax-text">Roles y Permisos</h1>
          <p className="mt-2 text-sm text-thorax-muted">Administra los roles disponibles y sus respectivos permisos.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-thorax-accent px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-thorax-accent-hover"
        >
          <Plus className="h-4 w-4" />
          Nuevo Rol
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
        <div className="grid gap-6 md:grid-cols-2">
          {roles.map((rol) => (
            <div key={rol.id} className="flex flex-col rounded-xl border border-thorax-border bg-thorax-card p-6">
              <div className="flex items-center gap-3 border-b border-thorax-border/50 pb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-thorax-accent/10">
                  <Shield className="h-5 w-5 text-thorax-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-thorax-text uppercase tracking-wide">{rol.nombre}</h3>
                  <p className="text-sm text-thorax-muted">{rol.descripcion || 'Sin descripción'}</p>
                </div>
              </div>
              
              <div className="mt-4 flex-1">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-thorax-muted">
                  Permisos Asignados ({rol.permisos?.length || 0})
                </p>
                {rol.permisos && rol.permisos.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {rol.permisos.map((p: any) => (
                      <AppBadge key={p.id} variant="neutral" className="inline-flex items-center gap-1 border border-thorax-border">
                        <Key className="h-3 w-3" />
                        {p.codigo}
                      </AppBadge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic text-thorax-muted">Ningún permiso asignado</p>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-thorax-border/50 flex justify-end">
                <button 
                  onClick={() => setManagingRole(rol)}
                  className="text-sm font-medium text-thorax-accent hover:underline"
                >
                  Gestionar Permisos
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-thorax-border bg-thorax-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-thorax-border/60 pb-4">
              <h2 className="text-xl font-bold text-thorax-text">Nuevo Rol</h2>
              <button onClick={() => setShowModal(false)} className="text-thorax-muted hover:text-thorax-text">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-thorax-muted">Nombre del Rol</label>
                <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent focus:ring-1 focus:ring-thorax-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-thorax-muted">Descripción</label>
                <textarea required rows={3} value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="mt-1 block w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text focus:border-thorax-accent focus:ring-1 focus:ring-thorax-accent" />
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-thorax-border bg-transparent px-4 py-2 text-sm font-medium text-thorax-text hover:bg-thorax-card-alt">Cancelar</button>
                <button type="submit" className="rounded-lg bg-thorax-accent px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-thorax-accent-hover">Crear Rol</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {managingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border border-thorax-border bg-thorax-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-thorax-border/60 p-6">
              <div>
                <h2 className="text-xl font-bold text-thorax-text">Permisos de: {managingRole.nombre}</h2>
                <p className="text-sm text-thorax-muted">Activa o desactiva permisos para este rol.</p>
              </div>
              <button onClick={() => setManagingRole(null)} className="text-thorax-muted hover:text-thorax-text">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-3">
              {permissions.map(p => {
                const hasPerm = managingRole.permisos?.some((rp:any) => rp.id === p.id)
                return (
                  <label key={p.id} className="flex items-start gap-3 rounded-lg border border-thorax-border/60 p-4 hover:bg-thorax-bg-deep cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={hasPerm}
                      onChange={() => togglePermission(managingRole.id, p.id, hasPerm)}
                      className="mt-1 h-4 w-4 rounded border-thorax-border text-thorax-accent focus:ring-thorax-accent bg-thorax-bg-deep"
                    />
                    <div>
                      <p className="text-sm font-medium text-thorax-text">{p.codigo}</p>
                      <p className="text-xs text-thorax-muted mt-1">{p.descripcion}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
