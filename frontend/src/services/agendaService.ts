import { apiFetch } from './api'

export async function listDisponibilidad(params?: { medico_id?: number; fecha?: string; disponible?: boolean }): Promise<any[]> {
  const q = new URLSearchParams()
  if (params?.medico_id) q.set('medico_id', String(params.medico_id))
  if (params?.fecha) q.set('fecha', params.fecha)
  if (params?.disponible !== undefined) q.set('disponible', String(params.disponible))
  const qs = q.toString() ? `?${q.toString()}` : ''
  return apiFetch<any[]>(`/api/v1/disponibilidad${qs}`)
}

export async function createDisponibilidad(payload: any): Promise<any> {
  return apiFetch<any>('/api/v1/disponibilidad', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function updateDisponibilidad(id: number, payload: any): Promise<any> {
  return apiFetch<any>(`/api/v1/disponibilidad/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })
}

export async function deleteDisponibilidad(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/disponibilidad/${id}`, {
    method: 'DELETE'
  })
}
