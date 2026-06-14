import type { TokenResponse, User } from '../types/api'
import { apiFetch, getApiBase, setToken } from './api'
import * as clinicalService from './clinicalService'

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams()
  body.set('username', email)
  body.set('password', password)

  const res = await fetch(`${getApiBase()}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) {
    let detail = 'No se pudo iniciar sesión'
    try {
      const j = (await res.json()) as { detail?: string }
      if (j.detail) detail = j.detail
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }
  const data = (await res.json()) as TokenResponse
  setToken(data.access_token)
  return data
}

export function logout() {
  setToken(null)
}

function mapUserFromApi(data: any): User {
  const roleName = data.rol?.nombre?.toLowerCase() || data.role?.toLowerCase() || 'clinician'
  const roles = Array.isArray(data.roles) && data.roles.length > 0 ? [...data.roles] : [roleName]
  return {
    id: data.id,
    email: data.email,
    full_name: data.nombre_completo ?? data.full_name ?? null,
    is_active: data.activo ?? data.is_active ?? true,
    role: roleName,
    roles,
    created_at: data.created_at ?? '',
    medico_id: data.medico_id ?? null,
  }
}

export async function fetchCurrentUser(): Promise<User> {
  const data = await apiFetch<any>('/api/v1/auth/me')
  const user = mapUserFromApi(data)

  if (!user.medico_id && (user.role === 'medico' || user.roles.includes('medico'))) {
    try {
      const clinicians = await clinicalService.listClinicians()
      const match = clinicians.find((c) => c.usuario_id === user.id)
      if (match) user.medico_id = match.id
    } catch {
      /* optional */
    }
  }

  return user
}
