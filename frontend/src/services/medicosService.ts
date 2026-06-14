import { apiFetch } from './api'

export async function listMedicos(): Promise<any[]> {
  return apiFetch<any[]>('/api/v1/medicos')
}

export async function updateMedico(id: number, payload: any): Promise<any> {
  return apiFetch<any>(`/api/v1/medicos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })
}
