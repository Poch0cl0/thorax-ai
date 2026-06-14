import type { Patient as ApiPatient } from '../types/api'
import type {
  AppointmentRecord,
  ClinicalViewModel,
  PatientRecord,
  PredictionListRow,
  PredictionRecord,
  SpecialistRecord,
} from '../types/clinical-domain'
import * as clinicalService from './clinicalService'
import { getMockClinicalSnapshot } from './mockClinicalStore'

export function isClinicalMock(): boolean {
  return import.meta.env.VITE_USE_CLINICAL_MOCK === 'true'
}

/** Mapea un rol crudo API (effective) hacia navegación de la app. */
export function apiRoleToAppRole(
  apiRole: string | undefined,
): import('../types/clinical-domain').AppRole {
  const lower = apiRole?.toLowerCase() ?? ''
  if (lower === 'admin' || lower === 'administrador') return 'admin'
  if (lower === 'secretaria' || lower === 'secretary') return 'secretaria'
  if (
    lower === 'especialista' ||
    lower === 'clinician' ||
    lower === 'clínico' ||
    lower === 'medico' ||
    lower === 'médico' ||
    lower === 'médico especialista'
  )
    return 'especialista'
  return 'especialista'
}

export function isAdminUser(user: { role?: string; roles?: string[] } | null | undefined): boolean {
  if (!user) return false
  const role = user.role?.toLowerCase() ?? ''
  if (role === 'admin' || role === 'administrador') return true
  return !!user.roles?.some((r) => {
    const lower = r.toLowerCase()
    return lower === 'admin' || lower === 'administrador'
  })
}

export function isDoctorRoleName(name: string | undefined): boolean {
  const lower = name?.toLowerCase() ?? ''
  return (
    lower === 'especialista' ||
    lower === 'medico' ||
    lower === 'médico' ||
    lower === 'clinician'
  )
}

/** Preferir `effectiveApiRole`; si no, mismo mapeo que antes con rol primario/mock. */
export function mapUserRoleToAppRole(
  email: string | undefined,
  apiRole: string,
  effectiveApiRole?: string | null,
): import('../types/clinical-domain').AppRole {
  if (effectiveApiRole && effectiveApiRole.trim()) {
    return apiRoleToAppRole(effectiveApiRole)
  }
  const lower = apiRole?.toLowerCase() ?? ''
  if (lower === 'admin' || lower === 'administrador') return 'admin'
  if (lower === 'secretaria' || lower === 'secretary') return 'secretaria'
  if (
    lower === 'especialista' || 
    lower === 'clinician' || 
    lower === 'clínico' ||
    lower === 'medico' ||
    lower === 'médico' ||
    lower === 'médico especialista'
  )
    return 'especialista'
  if (email && isClinicalMock()) {
    const demo = getMockClinicalSnapshot().demo_users[email.toLowerCase()]
    if (demo?.app_role) return demo.app_role
  }
  return 'especialista'
}

function studyTypeLabel(studyType: string, description: string | null): string {
  const map: Record<string, string> = {
    radiografia: 'Rayos X - Pecho',
    tomografia: 'Tomografía',
    pet_scan: 'PET-CT',
  }
  return description?.trim() || map[studyType] || studyType
}

export function deriveViewModel(data: import('../types/clinical-domain').DemoClinicalSeed): ClinicalViewModel {
  const patientById = new Map(data.patients.map((p) => [p.id, p]))
  const appointmentById = new Map(data.appointments.map((a) => [a.id, a]))
  const studyById = new Map(data.studies.map((s) => [s.id, s]))

  const predictionRows: PredictionListRow[] = data.predictions.map((pred) => {
    const study = studyById.get(pred.study_id)
    const appt =
      study?.appointment_id != null && study.appointment_id !== ''
        ? appointmentById.get(study.appointment_id)
        : undefined
    const pid = appt?.patient_id ?? study?.patient_id ?? null
    const patient = pid ? patientById.get(pid) : undefined
    const sched = appt?.scheduled_at
    const d = sched ? new Date(sched) : null
    const dateStr =
      d && !Number.isNaN(d.getTime())
        ? d.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : '—'
    const summary = study
      ? `${studyTypeLabel(study.study_type, study.description)} • ${dateStr}`
      : 'Estudio'

    return {
      prediction: pred,
      patientName: patient?.full_name ?? 'Paciente',
      studySummary: summary,
      studyDate: dateStr,
    }
  })

  return {
    patients: data.patients,
    specialists: data.specialists,
    appointments: data.appointments,
    studies: data.studies,
    predictions: data.predictions,
    diagnoses: data.diagnoses,
    predictionRows,
  }
}

function patientFromApi(p: ApiPatient): PatientRecord {
  return {
    id: String(p.id),
    full_name: `${p.nombres} ${p.apellidos}`.trim(),
    dni: p.dni,
    birth_date: p.fecha_nacimiento,
    gender: p.sexo,
    phone: p.telefono,
    email: p.email,
    address: p.direccion,
  }
}

export function normalizeAppointmentStatus(status: string): AppointmentRecord['status'] {
  const lower = status.toLowerCase()
  if (lower === 'pendiente') return 'pendiente'
  if (lower === 'atendida' || lower === 'atendido') return 'atendida'
  if (lower === 'cancelada' || lower === 'cancelado') return 'cancelada'
  if (lower === 'en_proceso') return 'en_proceso'
  return 'pendiente'
}

function mapAppointmentApi(a: import('./clinicalService').MappedAppointment): AppointmentRecord {
  return {
    id: String(a.id),
    patient_id: String(a.patient_id),
    specialist_id:
      a.attending_user_id != null ? String(a.attending_user_id) : null,
    scheduled_at: a.scheduled_at,
    status: normalizeAppointmentStatus(a.status),
    notes: a.notes,
    predicciones: (a as any).predicciones,
  }
}

function specialistsFromClinicians(cliniciansRaw: import('../types/api').UserBrief[]): SpecialistRecord[] {
  return cliniciansRaw.map((u) => ({
    id: String(u.id),
    user_id: String(u.id),
    usuario_id: u.usuario_id != null ? String(u.usuario_id) : undefined,
    cmp: u.cmp ?? '—',
    specialty: 'Neumología',
    display_name: u.full_name ?? u.email,
    email_hint: u.email,
  }))
}

async function loadBaseClinicalData() {
  const patientsApi = await clinicalService.listPatients()
  let apptsRaw: import('./clinicalService').MappedAppointment[] = []
  let cliniciansRaw: import('../types/api').UserBrief[] = []
  try {
    apptsRaw = await clinicalService.listAppointments()
  } catch {
    /* optional */
  }
  try {
    cliniciansRaw = await clinicalService.listClinicians()
  } catch {
    /* optional */
  }
  return {
    patientsApi,
    patients: patientsApi.map(patientFromApi),
    appointments: apptsRaw.map(mapAppointmentApi),
    specialists: specialistsFromClinicians(cliniciansRaw),
  }
}

export async function loadSecretariaViewModelFromApi(): Promise<ClinicalViewModel> {
  const { patients, appointments, specialists } = await loadBaseClinicalData()
  const data: import('../types/clinical-domain').DemoClinicalSeed = {
    demo_users: {},
    patients,
    specialists,
    appointments,
    studies: [],
    predictions: [],
    diagnoses: [],
  }
  return deriveViewModel(data)
}

export async function loadClinicalViewModelFromApi(): Promise<ClinicalViewModel> {
  const { patientsApi, patients, appointments, specialists } = await loadBaseClinicalData()

  const studiesFlat: import('../types/clinical-domain').StudyRecord[] = []
  const predictionsFlat: PredictionRecord[] = []

  for (const p of patientsApi) {
    const studies = await clinicalService.listStudiesByPatient(p.id)
    for (const s of studies) {
      const apLink =
        s.appointment_id != null &&
        appointments.some((a) => a.id === String(s.appointment_id))
          ? String(s.appointment_id)
          : null

      studiesFlat.push({
        id: String(s.id),
        patient_id: String(p.id),
        appointment_id: apLink,
        image_url: s.image_storage_key ?? '',
        study_type: s.modality?.toLowerCase() || 'radiografia',
        description: s.description,
      })
      const preds = await clinicalService.listPredictionsForStudy(s.id)
      for (const pr of preds) {
        predictionsFlat.push({
          id: String(pr.id),
          study_id: String(s.id),
          model_version: pr.model_version,
          probability:
            pr.risk_score != null
              ? Math.min(1, Math.max(0, pr.risk_score))
              : 0,
          result:
            pr.risk_score != null && pr.risk_score >= 0.5
              ? 'positivo'
              : 'negativo',
          finding_label: pr.finding_label,
          reviewed: true,
        })
      }
    }
  }

  const diagnoses: import('../types/clinical-domain').DiagnosisRecord[] = []

  const data: import('../types/clinical-domain').DemoClinicalSeed = {
    demo_users: {},
    patients,
    specialists,
    appointments,
    studies: studiesFlat,
    predictions: predictionsFlat,
    diagnoses,
  }

  return deriveViewModel(data)
}

export async function loadMedicoViewModelFromApi(medicoId: number): Promise<ClinicalViewModel> {
  const patientsApi = await clinicalService.listPatients({ medico_id: medicoId })
  const apptsRaw = await clinicalService.listAppointments({ medico_id: medicoId })
  let cliniciansRaw: import('../types/api').UserBrief[] = []
  try {
    cliniciansRaw = await clinicalService.listClinicians()
  } catch {
    /* optional */
  }
  const patients = patientsApi.map(patientFromApi)
  const appointments = apptsRaw.map(mapAppointmentApi)
  const specialists = specialistsFromClinicians(cliniciansRaw)
  const data: import('../types/clinical-domain').DemoClinicalSeed = {
    demo_users: {},
    patients,
    specialists,
    appointments,
    studies: [],
    predictions: [],
    diagnoses: [],
  }
  return deriveViewModel(data)
}
