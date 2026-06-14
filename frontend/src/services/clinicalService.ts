import type { ModelsInfo,
  AppointmentApi,
  Patient,
  Prediction, ScanResult,
  Study,
  UserBrief,
} from '../types/api'
import { apiFetch, getApiBase } from './api'

// Backend PacienteRead -> Frontend Patient
function mapPatient(p: any): Patient {
  return {
    id: p.id,
    external_ref: p.dni || null,
    display_name: `${p.nombres} ${p.apellidos}`.trim(),
    birth_date: p.fecha_nacimiento || null,
    notes: p.direccion || p.telefono || null,
    created_at: p.created_at,
  }
}

export async function listPatients(): Promise<Patient[]> {
  const data = await apiFetch<any[]>('/api/v1/pacientes')
  return data.map(mapPatient)
}

export async function createPatient(body: {
  display_name: string
  external_ref?: string | null
  birth_date?: string | null
  notes?: string | null
}): Promise<Patient> {
  const parts = body.display_name.trim().split(' ')
  const nombres = parts[0] || 'Desconocido'
  const apellidos = parts.length > 1 ? parts.slice(1).join(' ') : 'Desconocido'
  const payload = {
    nombres,
    apellidos,
    dni: body.external_ref || null,
    fecha_nacimiento: body.birth_date || null,
    direccion: body.notes || null,
  }
  const res = await apiFetch<any>('/api/v1/pacientes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return mapPatient(res)
}

export async function listClinicians(): Promise<UserBrief[]> {
  const data = await apiFetch<any[]>('/api/v1/medicos')
  return data.map(m => ({
    id: m.id,
    email: m.email || '',
    full_name: `${m.nombres} ${m.apellidos}`.trim(),
    roles: ['clinician'],
  }))
}

// Cita -> AppointmentApi
function mapAppointment(c: any): AppointmentApi {
  return {
    id: c.id,
    patient_id: c.paciente_id,
    attending_user_id: c.medico_id,
    scheduled_at: c.fecha_cita,
    status: c.estado,
    notes: c.observaciones || c.motivo_consulta || null,
    created_by_id: null,
    created_at: c.created_at,
    updated_at: c.created_at,
  }
}

export async function listAppointments(_params?: {
  scheduled_from?: string
  scheduled_to?: string
}): Promise<AppointmentApi[]> {
  const data = await apiFetch<any[]>('/api/v1/citas')
  return data.map(mapAppointment)
}

export async function createAppointment(body: {
  patient_id: number
  attending_user_id: number
  scheduled_at: string
  notes?: string | null
  status?: string
}): Promise<AppointmentApi> {
  const payload = {
    paciente_id: body.patient_id,
    medico_id: body.attending_user_id,
    fecha_cita: body.scheduled_at,
    observaciones: body.notes || null,
  }
  const res = await apiFetch<any>('/api/v1/citas', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return mapAppointment(res)
}

export async function updateAppointment(
  id: number,
  body: Partial<{
    patient_id: number
    attending_user_id: number | null
    scheduled_at: string
    notes: string | null
    status: string
  }>,
): Promise<AppointmentApi> {
  const payload: any = {}
  if (body.attending_user_id !== undefined) payload.medico_id = body.attending_user_id
  if (body.scheduled_at !== undefined) payload.fecha_cita = body.scheduled_at
  if (body.status !== undefined) payload.estado = body.status
  if (body.notes !== undefined) payload.observaciones = body.notes

  const res = await apiFetch<any>(`/api/v1/citas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return mapAppointment(res)
}

export async function deleteAppointment(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/citas/${id}`, {
    method: 'DELETE',
  })
}

// --- Studies & Predictions ---
// Backend /predicciones
function mapPrediction(p: any): Prediction {
  return {
    id: p.id,
    study_id: p.id, // Mock study id to match frontend expectation
    created_by_id: p.medico_id,
    model_version: p.modelo_utilizado,
    risk_score: p.probabilidad,
    finding_label: p.clase_predicha,
    details: {
      nivel_riesgo: p.nivel_riesgo,
      imagen_procesada_path: p.imagen_procesada_path,
      imagen_original_path: p.imagen_original_path
    },
    created_at: p.fecha_prediccion,
  }
}

export async function listStudiesByPatient(patientId: number): Promise<Study[]> {
  const data = await apiFetch<any[]>(`/api/v1/predicciones?paciente_id=${patientId}`)
  return data.map(p => ({
    id: p.id,
    patient_id: p.paciente_id,
    study_instance_uid: null,
    modality: 'radiografia',
    description: null,
    image_storage_key: p.imagen_original_path,
    created_at: p.fecha_prediccion,
  }))
}

export async function createStudy(_body: any): Promise<Study> {
  throw new Error("No implementado: use createStudyWithImage (API en español requiere imagen)")
}

export async function createStudyWithImage(_body: {
  patient_id: number
  appointment_id?: number | null
  modality?: string
  description?: string | null
  file: File
}): Promise<Study> {
  // En backend, la prediccion y la imagen se suben juntas.
  // Guardaremos la info para runPrediction, pero como no sabemos el medico_id aquí...
  // Lo correcto es modificar los componentes, pero para mantener la API del service sin romper:
  throw new Error("Modificado: Usar createPredictionDirectly desde UI")
}

// NUEVA FUNCIÓN PARA REEMPLAZAR EL FLUJO EN DOS PASOS:
export async function createPredictionDirectly(body: {
  patient_id: number
  medico_id: number
  model_type: string
  file: File
}): Promise<Prediction> {
  const fd = new FormData()
  fd.set('paciente_id', String(body.patient_id))
  fd.set('medico_id', String(body.medico_id))
  fd.set('modelo', body.model_type === 'random_forest' ? 'rf' : 'lr')
  fd.set('radiografia', body.file)

  const p = await apiFetch<any>('/api/v1/predicciones', {
    method: 'POST',
    body: fd,
  })
  return mapPrediction(p)
}

export async function runPrediction(_studyId: number, _modelType?: string): Promise<Prediction> {
  // Should not be used anymore for API flow, we use createPredictionDirectly
  throw new Error("Deprecated in new backend flow. Use createPredictionDirectly.")
}

export async function getPrediction(predictionId: number): Promise<Prediction> {
  const data = await apiFetch<any>(`/api/v1/predicciones/${predictionId}`)
  return mapPrediction(data)
}

export async function clearAllPredictions(): Promise<void> {
  // Backend no lo soporta
}

export async function deletePrediction(_predictionId: number): Promise<void> {
  // Backend no lo soporta
}

export async function listPredictionsForStudy(studyId: number): Promise<Prediction[]> {
  const data = await apiFetch<any>(`/api/v1/predicciones/${studyId}`)
  return [mapPrediction(data)]
}

export async function analyzeScan(
  file: File,
  modelType: string = 'random_forest',
): Promise<ScanResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('model_type', modelType)

  const base = getApiBase()
  const res = await fetch(`${base}/api/v1/escaner/analizar`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    let detail = res.statusText
    try {
      const err = (await res.json()) as { detail?: unknown }
      if (typeof err.detail === 'string') detail = err.detail
      else if (Array.isArray(err.detail)) detail = JSON.stringify(err.detail)
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }

  return res.json() as Promise<ScanResult>
}

export async function getAvailableModels(): Promise<ModelsInfo> {
  const base = getApiBase()
  const res = await fetch(`${base}/api/v1/escaner/modelos`)
  if (!res.ok) throw new Error('Error al obtener modelos disponibles')
  return res.json() as Promise<ModelsInfo>
}
