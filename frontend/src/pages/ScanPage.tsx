import { useEffect, useState } from 'react'
import { Activity, ArrowLeft, Loader2, Upload, Users } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { listPacientesClinicos, type PacienteClinico } from '../services/medicoService'
import * as clinicalService from '../services/clinicalService'
import { AppBadge } from '../components/ui/AppBadge'
import { ClinicalDataDisplay } from '../features/clinical/ClinicalDataDisplay'

function riskVariant(level: string | undefined) {
  const l = level?.toLowerCase() ?? ''
  if (l === 'alto' || l === 'high') return 'danger' as const
  if (l === 'medio' || l === 'moderado') return 'warning' as const
  return 'success' as const
}

export function ScanPage() {
  const { user } = useAuth()
  const [patients, setPatients] = useState<PacienteClinico[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PacienteClinico | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [model, setModel] = useState('lr')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any | null>(null)

  useEffect(() => {
    listPacientesClinicos()
      .then(setPatients)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleAnalyze() {
    if (!selected || !file) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const dcId = selected.ultimo_dato_clinico?.id as number | undefined
      const dcMedicoId = selected.ultimo_dato_clinico?.medico_id as number | undefined
      const pred = await clinicalService.createPredictionDirectly({
        patient_id: selected.paciente.id,
        medico_id: user?.medico_id ?? dcMedicoId ?? undefined,
        datos_clinicos_id: dcId,
        model_type: model,
        file,
      })
      setResult(pred)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el análisis')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-thorax-muted">
        <Loader2 className="h-8 w-8 animate-spin text-thorax-accent" />
      </div>
    )
  }

  if (selected) {
    const dc = selected.ultimo_dato_clinico as Record<string, unknown> | null
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <button type="button" onClick={() => { setSelected(null); setResult(null); setFile(null) }}
          className="inline-flex items-center gap-2 text-sm text-thorax-muted hover:text-thorax-text">
          <ArrowLeft className="h-4 w-4" /> Volver al listado
        </button>
        <div>
          <h1 className="text-2xl font-bold text-thorax-text">Análisis IA — {selected.paciente.nombres} {selected.paciente.apellidos}</h1>
          <p className="mt-1 text-sm text-thorax-muted">Suba una radiografía para obtener la predicción de riesgo.</p>
        </div>

        <div className="rounded-xl border border-thorax-border bg-thorax-card p-5">
          <ClinicalDataDisplay data={dc} title="Datos clínicos del paciente" compact />
        </div>

        <div className="rounded-xl border border-thorax-border bg-thorax-card p-6 space-y-4">
          <label className="block text-sm font-medium text-thorax-muted">Modelo</label>
          <select value={model} onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text">
            <option value="lr">Regresión Logística (lr)</option>
            <option value="rf">Random Forest (rf)</option>
          </select>

          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-thorax-border p-8 cursor-pointer hover:border-thorax-accent/50">
            <Upload className="h-8 w-8 text-thorax-muted" />
            <span className="text-sm text-thorax-muted">{file ? file.name : 'Seleccionar imagen RX'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="button" disabled={!file || busy} onClick={() => void handleAnalyze()}
            className="w-full rounded-xl bg-thorax-accent py-3 text-sm font-semibold text-slate-900 hover:bg-thorax-accent-hover disabled:opacity-50">
            {busy ? 'Analizando…' : 'Analizar imagen'}
          </button>
        </div>

        {result && (
          <div className="rounded-xl border border-thorax-accent/30 bg-thorax-card p-6 space-y-3">
            <h2 className="text-lg font-semibold text-thorax-text flex items-center gap-2">
              <Activity className="h-5 w-5 text-thorax-accent" /> Resultado
            </h2>
            <p className="text-sm"><span className="text-thorax-muted">Clase:</span> {result.disease_class ?? result.clase_predicha}</p>
            <p className="text-sm"><span className="text-thorax-muted">Probabilidad:</span> {((result.risk_score ?? result.probabilidad ?? 0) * 100).toFixed(1)}%</p>
            <AppBadge variant={riskVariant(result.details?.risk_level ?? result.nivel_riesgo)}>
              Riesgo {(result.details?.risk_level ?? result.nivel_riesgo ?? '—').toString()}
            </AppBadge>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-thorax-text">Análisis IA</h1>
        <p className="mt-2 text-sm text-thorax-muted">Seleccione un paciente atendido (con datos clínicos) para analizar su radiografía.</p>
      </div>

      {patients.length === 0 ? (
        <p className="rounded-xl border border-dashed border-thorax-border p-8 text-center text-sm text-thorax-muted">
          No hay pacientes con datos clínicos. Atienda citas primero para habilitar el análisis.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {patients.map((row) => {
            const p = row.paciente
            const pred = row.ultima_prediccion as Record<string, unknown> | null
            const dc = row.ultimo_dato_clinico as Record<string, unknown> | null
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(row)}
                className="text-left rounded-xl border border-thorax-border bg-thorax-card p-5 hover:border-thorax-accent/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-thorax-text">{p.nombres} {p.apellidos}</p>
                    <p className="text-xs text-thorax-muted mt-1">DNI: {p.dni ?? '—'}</p>
                  </div>
                  <Users className="h-5 w-5 text-thorax-accent shrink-0" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {dc?.fumador != null && <span className="rounded-full bg-thorax-bg-deep px-2 py-0.5 text-thorax-muted">Fumador: {dc.fumador ? 'Sí' : 'No'}</span>}
                  {dc?.edad != null && <span className="rounded-full bg-thorax-bg-deep px-2 py-0.5 text-thorax-muted">Edad: {String(dc.edad)}</span>}
                  {pred && (
                    <AppBadge variant={riskVariant(String(pred.nivel_riesgo))}>
                      Riesgo {String(pred.nivel_riesgo)}
                    </AppBadge>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
