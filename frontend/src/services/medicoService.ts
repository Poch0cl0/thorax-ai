import { apiFetch } from './api'
import type { Patient } from '../types/api'

export type PacienteClinico = {
  paciente: Patient
  ultimo_dato_clinico: Record<string, unknown> | null
  ultima_prediccion: Record<string, unknown> | null
}

export async function listPacientesClinicos(medicoId?: number): Promise<PacienteClinico[]> {
  const q = medicoId ? `?medico_id=${medicoId}` : ''
  return apiFetch<PacienteClinico[]>(`/api/v1/medicos/me/pacientes-clinicos${q}`)
}

export async function listAssignedPatients(opts?: {
  medicoId?: number
  conDatosClinicos?: boolean
}): Promise<Patient[]> {
  const q = new URLSearchParams()
  if (opts?.medicoId) q.set('medico_id', String(opts.medicoId))
  if (opts?.conDatosClinicos) q.set('con_datos_clinicos', 'true')
  const qs = q.toString() ? `?${q.toString()}` : ''
  return apiFetch<Patient[]>(`/api/v1/pacientes${qs}`)
}
