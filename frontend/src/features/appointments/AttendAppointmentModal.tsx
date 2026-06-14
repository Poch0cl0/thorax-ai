import { useState } from 'react'
import { X, Upload, Loader2, PlayCircle, CheckCircle2 } from 'lucide-react'
import * as clinicalService from '../../services/clinicalService'
import { apiFetch } from '../../services/api'
import type { AppointmentRecord } from '../../types/clinical-domain'
import type { ScanResult } from '../../types/api'
import { useAuth } from '../../context/useAuth'

type AttendModalProps = {
  appointment: AppointmentRecord
  patientName: string
  onClose: () => void
  onSuccess: () => void
}

export function AttendAppointmentModal({ appointment, patientName, onClose, onSuccess }: AttendModalProps) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [diagnostico, setDiagnostico] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const modelType = 'logistic_regression'

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(f)
    }
  }

  async function handlePredict() {
    if (!file || !user) return
    setLoading(true)
    try {
      const scanResult = await clinicalService.analyzeScan(file, modelType)
      setResult(scanResult)
      // Append recommendation to text area
      if (scanResult.recommendation) {
        setDiagnostico(prev => prev ? prev + '\n\nIA: ' + scanResult.recommendation : 'IA: ' + scanResult.recommendation)
      }
    } catch {
      alert("Error en la predicción")
    } finally {
      setLoading(false)
    }
  }

  async function handleFinalize() {
    if (!user) return
    setLoading(true)
    try {
      const medicoId = appointment.specialist_id ? Number(appointment.specialist_id) : user.id

      // Create prediction if exists
      let createdPredictionId: number | null = null
      if (result && file) {
         const pred = await clinicalService.createPredictionDirectly({
           patient_id: Number(appointment.patient_id),
           medico_id: medicoId,
           cita_id: Number(appointment.id),
           model_type: modelType,
           file: file
         })
         createdPredictionId = Number(pred.id)
      }

      // Add clinical data observation (diagnostico)
      if (diagnostico) {
        await apiFetch(`/api/v1/datos-clinicos`, {
          method: 'POST',
          body: JSON.stringify({
            paciente_id: Number(appointment.patient_id),
            medico_id: medicoId,
            observaciones: diagnostico
          })
        })
      }

      // Finalize appointment
      await clinicalService.updateAppointment(Number(appointment.id), {
        status: 'atendida',
        notes: diagnostico || undefined
      })
      onSuccess()
    } catch {
      alert("Error al finalizar la cita")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-thorax-border bg-thorax-card p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-thorax-border/60 pb-4 mb-4">
          <h2 className="text-xl font-bold text-thorax-text">Atender Paciente: {patientName}</h2>
          <button onClick={onClose} className="text-thorax-muted hover:text-thorax-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Izquierda: Imagen y Predicción */}
            <div className="space-y-4">
              <h3 className="font-semibold text-thorax-text border-b border-thorax-border pb-2">1. Análisis IA (Opcional)</h3>
              
              <div className="border border-dashed border-thorax-border p-4 rounded-xl bg-thorax-bg-deep text-center relative overflow-hidden">
                {!preview ? (
                  <div>
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={handleFileChange} />
                    <Upload className="mx-auto h-8 w-8 text-thorax-muted mb-2" />
                    <p className="text-sm text-thorax-muted">Haz clic o arrastra para subir Radiografía</p>
                  </div>
                ) : (
                  <div className="relative">
                    <img src={preview} alt="Radiografía" className="max-h-48 mx-auto rounded" />
                    <button onClick={() => { setFile(null); setPreview(null); setResult(null); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs">✕</button>
                  </div>
                )}
              </div>

              {file && !result && (
                <button onClick={handlePredict} disabled={loading} className="w-full bg-thorax-accent/20 text-thorax-accent border border-thorax-accent/50 rounded-lg py-2 flex items-center justify-center gap-2 hover:bg-thorax-accent/30 font-semibold">
                  {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                  Ejecutar Predicción IA
                </button>
              )}

              {result && (
                <div className={`p-4 rounded-lg border ${result.prediction === 'cancer_detected' ? 'border-red-500/30 bg-red-500/10' : 'border-green-500/30 bg-green-500/10'}`}>
                  <p className="font-bold text-lg mb-1">{result.prediction === 'cancer_detected' ? '🔴 Anomalía Detectada' : '🟢 Sin Anomalías'}</p>
                  <p className="text-sm">Confianza: {(result.confidence_percent).toFixed(1)}%</p>
                  <p className="text-xs text-thorax-muted mt-2">La sugerencia ha sido agregada al campo de diagnóstico.</p>
                </div>
              )}
            </div>

            {/* Derecha: Diagnóstico */}
            <div className="space-y-4">
              <h3 className="font-semibold text-thorax-text border-b border-thorax-border pb-2">2. Diagnóstico / Recomendación</h3>
              <textarea 
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                rows={10}
                placeholder="Escribe aquí las observaciones clínicas y recomendaciones para el paciente..."
                className="w-full rounded-xl border border-thorax-border bg-thorax-bg-deep p-3 text-sm text-thorax-text focus:border-thorax-accent outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-thorax-border/60">
            <button onClick={onClose} className="rounded-lg border border-thorax-border px-4 py-2 text-sm font-medium text-thorax-text hover:bg-thorax-card-alt">
              Cancelar
            </button>
            <button onClick={handleFinalize} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-thorax-accent px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-thorax-accent-hover disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Finalizar Cita
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
