import { apiFetch, getApiBase } from './api'
import { getToken } from './api'

export async function listRecommendations(patientId?: number): Promise<any[]> {
  const url = patientId ? `/api/v1/recomendaciones?paciente_id=${patientId}` : '/api/v1/recomendaciones'
  return apiFetch<any[]>(url)
}

export async function generateRecommendation(predictionId: number): Promise<any> {
  return apiFetch<any>(`/api/v1/recomendaciones/predicciones/${predictionId}`, {
    method: 'POST'
  })
}

export async function downloadPdf(recommendationId: number): Promise<void> {
  const token = getToken()
  const res = await fetch(`${getApiBase()}/api/v1/recomendaciones/${recommendationId}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  if (!res.ok) throw new Error('Error al descargar PDF')
  
  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Recomendacion_${recommendationId}.pdf`
  a.click()
  window.URL.revokeObjectURL(url)
}

export async function sendEmail(recommendationId: number, email?: string, subject?: string): Promise<any> {
  return apiFetch<any>(`/api/v1/recomendaciones/${recommendationId}/send-email`, {
    method: 'POST',
    body: JSON.stringify({ email, subject })
  })
}
