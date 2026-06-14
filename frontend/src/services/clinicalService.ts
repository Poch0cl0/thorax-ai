import type { ModelsInfo,
  Patient,
  Prediction, ScanResult,
  Study,
  UserBrief,
} from '../types/api'
import { apiFetch, getApiBase } from './api'

// Backend PacienteRead -> Frontend Patient
function mapPatient(p: any): Patient {
  return p as Patient
}

export async function listPatients(params?: {
  medico_id?: number
  con_datos_clinicos?: boolean
}): Promise<Patient[]> {
  const q = new URLSearchParams()
  if (params?.medico_id) q.set('medico_id', String(params.medico_id))
  if (params?.con_datos_clinicos) q.set('con_datos_clinicos', 'true')
  const qs = q.toString() ? `?${q.toString()}` : ''
  const data = await apiFetch<any[]>(`/api/v1/pacientes${qs}`)
  return data.map(mapPatient)
}

export async function createPatient(body: Partial<Patient>): Promise<Patient> {
  const payload = {
    nombres: body.nombres || 'Desconocido',
    apellidos: body.apellidos || 'Desconocido',
    dni: body.dni || null,
    fecha_nacimiento: body.fecha_nacimiento || null,
    sexo: body.sexo || null,
    telefono: body.telefono || null,
    email: body.email || null,
    direccion: body.direccion || null,
  }
  const res = await apiFetch<any>('/api/v1/pacientes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return mapPatient(res)
}

export async function updatePatient(id: number, body: Partial<Patient>): Promise<Patient> {
  const payload = {
    nombres: body.nombres || undefined,
    apellidos: body.apellidos || undefined,
    dni: body.dni || undefined,
    fecha_nacimiento: body.fecha_nacimiento || undefined,
    sexo: body.sexo || undefined,
    telefono: body.telefono || undefined,
    email: body.email || undefined,
    direccion: body.direccion || undefined,
  }
  const res = await apiFetch<any>(`/api/v1/pacientes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return mapPatient(res)
}

export async function deletePatient(id: number): Promise<void> {
  await apiFetch<void>(`/api/v1/pacientes/${id}`, {
    method: 'DELETE',
  })
}

export type MappedAppointment = {
  id: number
  patient_id: number
  attending_user_id: number | null
  scheduled_at: string
  status: string
  notes: string | null
  created_by_id: number | null
  created_at: string
  updated_at: string
  predicciones?: any[]
}

// ... in listAppointments
export async function listClinicians(): Promise<UserBrief[]> {
  const data = await apiFetch<any[]>('/api/v1/medicos')
  return data.map((m) => ({
    id: m.id,
    usuario_id: m.usuario_id ?? m.usuario?.id,
    email: m.usuario?.email ?? m.email ?? '',
    full_name: (m.usuario?.nombre_completo ?? `${m.nombres ?? ''} ${m.apellidos ?? ''}`.trim()) || 'Médico',
    cmp: m.cmp ?? null,
    roles: ['medico'],
  }))
}

export async function getPatient(id: number): Promise<Patient> {
  const res = await apiFetch<any>(`/api/v1/pacientes/${id}`)
  return mapPatient(res)
}

// Cita -> AppointmentApi
function mapAppointment(c: any): MappedAppointment {
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
    predicciones: c.predicciones,
  }
}

export async function listAppointments(params?: {
  medico_id?: number
  estado?: string
  paciente_id?: number
}): Promise<MappedAppointment[]> {
  const q = new URLSearchParams()
  if (params?.medico_id) q.set('medico_id', String(params.medico_id))
  if (params?.estado) q.set('estado', params.estado)
  if (params?.paciente_id) q.set('paciente_id', String(params.paciente_id))
  const qs = q.toString() ? `?${q.toString()}` : ''
  const data = await apiFetch<any[]>(`/api/v1/citas${qs}`)
  return data.map(mapAppointment)
}

export async function listClinicalData(params?: {
  paciente_id?: number
  cita_id?: number
}): Promise<any[]> {
  const q = new URLSearchParams()
  if (params?.paciente_id) q.set('paciente_id', String(params.paciente_id))
  if (params?.cita_id) q.set('cita_id', String(params.cita_id))
  const qs = q.toString() ? `?${q.toString()}` : ''
  return apiFetch<any[]>(`/api/v1/datos-clinicos${qs}`)
}

export async function createAppointment(body: {
  patient_id: number
  attending_user_id: number
  scheduled_at: string
  notes?: string | null
  status?: string
  disponibilidad_id?: number | null
}): Promise<MappedAppointment> {
  const payload = {
    paciente_id: body.patient_id,
    medico_id: body.attending_user_id,
    fecha_cita: body.scheduled_at,
    motivo_consulta: body.notes || null,
    observaciones: null,
    disponibilidad_id: body.disponibilidad_id ?? null,
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
    disponibilidad_id: number | null
  }>,
): Promise<MappedAppointment> {
  const payload: any = {}
  if (body.attending_user_id !== undefined) payload.medico_id = body.attending_user_id
  if (body.scheduled_at !== undefined) payload.fecha_cita = body.scheduled_at
  if (body.status !== undefined) payload.estado = body.status
  if (body.notes !== undefined) payload.motivo_consulta = body.notes
  if (body.disponibilidad_id !== undefined) payload.disponibilidad_id = body.disponibilidad_id

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
    study_id: p.id,
    created_by_id: p.medico_id,
    model_version: p.modelo_utilizado,
    risk_score: p.probabilidad,
    finding_label: p.clase_predicha,
    disease_class: p.clase_predicha,
    clase_predicha: p.clase_predicha,
    probabilidad: p.probabilidad,
    nivel_riesgo: p.nivel_riesgo,
    details: {
      nivel_riesgo: p.nivel_riesgo,
      risk_level: p.nivel_riesgo,
      imagen_procesada_path: p.imagen_procesada_path,
      imagen_original_path: p.imagen_original_path,
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
  medico_id?: number
  cita_id?: number
  datos_clinicos_id?: number
  model_type?: string
  file: File
}): Promise<Prediction> {
  const fd = new FormData()
  fd.set('paciente_id', String(body.patient_id))
  if (body.medico_id) fd.set('medico_id', String(body.medico_id))
  if (body.cita_id) fd.set('cita_id', String(body.cita_id))
  if (body.datos_clinicos_id) fd.set('datos_clinicos_id', String(body.datos_clinicos_id))
  const model = body.model_type ?? 'lr'
  fd.set('modelo', model === 'random_forest' || model === 'rf' ? 'rf' : 'lr')
  fd.set('radiografia', body.file)

  const p = await apiFetch<any>('/api/v1/predicciones', {
    method: 'POST',
    body: fd,
  })
  return mapPrediction(p)
}

export async function sendAiDiagnosis(predictionId: number): Promise<void> {
  // First, generate the recommendation to make sure it exists
  const rec = await apiFetch<any>(`/api/v1/recomendaciones/predicciones/${predictionId}`, {
    method: 'POST'
  })
  
  // Then send it by email
  await apiFetch(`/api/v1/recomendaciones/${rec.id}/send-email`, {
    method: 'POST',
    body: JSON.stringify({}),
    headers: { 'Content-Type': 'application/json' },
  })
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
