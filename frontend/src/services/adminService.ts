import { apiFetch } from './api'

export async function listUsers(): Promise<any[]> {
  return apiFetch<any[]>('/api/v1/usuarios')
}

export async function createUser(payload: any): Promise<any> {
  return apiFetch<any>('/api/v1/usuarios', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function updateUser(id: number, payload: any): Promise<any> {
  return apiFetch<any>(`/api/v1/usuarios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })
}

export async function deleteUser(id: number): Promise<any> {
  return apiFetch<any>(`/api/v1/usuarios/${id}`, {
    method: 'DELETE'
  })
}

export async function listRoles(): Promise<any[]> {
  return apiFetch<any[]>('/api/v1/roles-permisos/roles')
}

export async function listPermissions(): Promise<any[]> {
  return apiFetch<any[]>('/api/v1/roles-permisos/permisos')
}

export async function createRole(payload: any): Promise<any> {
  return apiFetch<any>('/api/v1/roles-permisos/roles', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function assignPermission(roleId: number, permissionId: number): Promise<any> {
  return apiFetch<any>(`/api/v1/roles-permisos/roles/${roleId}/permisos/${permissionId}`, {
    method: 'POST'
  })
}

export async function removePermission(roleId: number, permissionId: number): Promise<any> {
  return apiFetch<any>(`/api/v1/roles-permisos/roles/${roleId}/permisos/${permissionId}`, {
    method: 'DELETE'
  })
}
