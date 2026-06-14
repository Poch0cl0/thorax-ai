import { getApiBase, getToken } from './api'

export async function listRecommendations(patientId?: number): Promise<any[]> {
  const url = patientId ? `/api/v1/recomendaciones?paciente_id=${patientId}` : '/api/v1/recomendaciones'
  const { apiFetch } = await import('./api')
  return apiFetch<any[]>(url)
}

export async function generateRecommendation(predictionId: number): Promise<any> {
  const { apiFetch } = await import('./api')
  return apiFetch<any>(`/api/v1/recomendaciones/predicciones/${predictionId}`, {
    method: 'POST',
  })
}

export async function downloadPdf(recommendationId: number): Promise<void> {
  const token = getToken()
  const res = await fetch(`${getApiBase()}/api/v1/recomendaciones/${recommendationId}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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

export async function sendEmailWithAttachment(
  recommendationId: number,
  form: FormData,
): Promise<any> {
  const token = getToken()
  const res = await fetch(`${getApiBase()}/api/v1/recomendaciones/${recommendationId}/send-email`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const err = await res.json()
      if (typeof err.detail === 'string') detail = err.detail
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }
  return res.json()
}
