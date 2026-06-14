import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Mail,
  Sparkles,
  Users,
} from 'lucide-react'
import { listPacientesClinicos, type PacienteClinico } from '../services/medicoService'
import * as recommendationService from '../services/recommendationService'
import { AppBadge } from '../components/ui/AppBadge'
import { ClinicalDataDisplay } from '../features/clinical/ClinicalDataDisplay'

function riskVariant(level: string | undefined) {
  const l = level?.toLowerCase() ?? ''
  if (l === 'alto' || l === 'high') return 'danger' as const
  if (l === 'medio' || l === 'moderado') return 'warning' as const
  return 'success' as const
}

function formatRecommendation(text: string) {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) return <br key={i} />
    if (trimmed.startsWith('# ')) {
      return <h3 key={i} className="mt-4 mb-2 text-base font-bold text-thorax-text">{trimmed.slice(2)}</h3>
    }
    if (trimmed.startsWith('## ')) {
      return <h4 key={i} className="mt-3 mb-1 text-sm font-semibold text-thorax-accent">{trimmed.slice(3)}</h4>
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return <li key={i} className="ml-4 list-disc text-sm text-thorax-text/90">{trimmed.slice(2)}</li>
    }
    return <p key={i} className="text-sm leading-relaxed text-thorax-text/90">{trimmed}</p>
  })
}

export function RecommendationsPage() {
  const [patients, setPatients] = useState<PacienteClinico[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PacienteClinico | null>(null)
  const [recommendation, setRecommendation] = useState<any | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmail, setShowEmail] = useState(false)
  const [emailForm, setEmailForm] = useState({ email: '', subject: 'Reporte médico - recomendaciones', mensaje: '' })
  const [emailFile, setEmailFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    listPacientesClinicos()
      .then((rows) => setPatients(rows.filter((r) => r.ultima_prediccion != null)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleGenerate() {
    if (!selected?.ultima_prediccion) return
    const predId = (selected.ultima_prediccion as any).id
    setGenerating(true)
    setError(null)
    try {
      const rec = await recommendationService.generateRecommendation(predId)
      setRecommendation(rec)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar recomendaciones')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!recommendation) return
    setSending(true)
    setError(null)
    try {
      const fd = new FormData()
      if (emailForm.email) fd.set('email', emailForm.email)
      fd.set('subject', emailForm.subject)
      if (emailForm.mensaje) fd.set('mensaje', emailForm.mensaje)
      if (emailFile) fd.set('archivo', emailFile)
      await recommendationService.sendEmailWithAttachment(recommendation.id, fd)
      setShowEmail(false)
      alert('Reporte enviado correctamente.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar correo')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-thorax-accent" />
      </div>
    )
  }

  if (selected) {
    const p = selected.paciente
    const dc = selected.ultimo_dato_clinico as Record<string, unknown> | null
    const pred = selected.ultima_prediccion as Record<string, unknown> | null

    return (
      <div className="mx-auto max-w-6xl space-y-8">
        <button type="button" onClick={() => { setSelected(null); setRecommendation(null) }}
          className="inline-flex items-center gap-2 text-sm text-thorax-muted hover:text-thorax-text">
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>

        <div>
          <h1 className="text-2xl font-bold text-thorax-text">{p.nombres} {p.apellidos}</h1>
          <p className="text-sm text-thorax-muted mt-1">Recomendaciones basadas en riesgo y datos clínicos</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-thorax-border bg-thorax-card p-6 space-y-3">
            <ClinicalDataDisplay data={dc} title="Datos clínicos" />
          </div>

          <div className="rounded-xl border border-thorax-border bg-thorax-card p-6 space-y-3">
            <h2 className="font-semibold text-thorax-text">Riesgo de cáncer de tórax</h2>
            {pred ? (
              <>
                <p className="text-sm">{String(pred.clase_predicha)} — {(Number(pred.probabilidad) * 100).toFixed(1)}%</p>
                <AppBadge variant={riskVariant(String(pred.nivel_riesgo))}>Riesgo {String(pred.nivel_riesgo)}</AppBadge>
                {!recommendation && (
                  <button type="button" disabled={generating} onClick={() => void handleGenerate()}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-thorax-accent px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-thorax-accent-hover disabled:opacity-50">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Obtener recomendaciones
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm text-thorax-muted">El paciente necesita una predicción IA primero.</p>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {recommendation && (
          <div className="rounded-xl border border-thorax-accent/20 bg-thorax-card p-8 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="text-lg font-bold text-thorax-text flex items-center gap-2">
                <FileText className="h-5 w-5 text-thorax-accent" /> Recomendaciones IA
              </h2>
              <div className="flex gap-2">
                <button type="button" onClick={() => void recommendationService.downloadPdf(recommendation.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-thorax-border px-3 py-2 text-xs font-medium text-thorax-text hover:bg-thorax-bg-deep">
                  <Download className="h-4 w-4" /> Descargar PDF
                </button>
                <button type="button" onClick={() => {
                  setEmailForm({ ...emailForm, email: p.email ?? '' })
                  setShowEmail(true)
                }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-thorax-accent px-3 py-2 text-xs font-semibold text-slate-900">
                  <Mail className="h-4 w-4" /> Enviar reporte
                </button>
              </div>
            </div>
            <div className="prose prose-invert max-w-none space-y-2 rounded-xl bg-thorax-bg-deep/60 p-6">
              {formatRecommendation(recommendation.contenido_recomendacion ?? '')}
            </div>
          </div>
        )}

        {showEmail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <form onSubmit={handleSendEmail} className="w-full max-w-md rounded-2xl border border-thorax-border bg-thorax-card p-6 space-y-4">
              <h3 className="text-lg font-bold text-thorax-text">Enviar reporte al paciente</h3>
              <input type="email" required placeholder="Email destino" value={emailForm.email}
                onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                className="w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text" />
              <input type="text" value={emailForm.subject} onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                className="w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text" />
              <textarea rows={3} placeholder="Mensaje del correo" value={emailForm.mensaje}
                onChange={(e) => setEmailForm({ ...emailForm, mensaje: e.target.value })}
                className="w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text" />
              <label className="block text-xs text-thorax-muted">
                Adjunto (opcional — si no se envía, usa el PDF generado)
                <input type="file" className="mt-1 block w-full text-sm" onChange={(e) => setEmailFile(e.target.files?.[0] ?? null)} />
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowEmail(false)} className="rounded-lg border border-thorax-border px-4 py-2 text-sm">Cancelar</button>
                <button type="submit" disabled={sending} className="rounded-lg bg-thorax-accent px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50">
                  {sending ? 'Enviando…' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-thorax-text">Recomendaciones IA</h1>
        <p className="mt-2 text-sm text-thorax-muted">Pacientes con datos clínicos y predicción de riesgo.</p>
      </div>

      {patients.length === 0 ? (
        <p className="rounded-xl border border-dashed border-thorax-border p-8 text-center text-sm text-thorax-muted">
          No hay pacientes con predicción IA. Complete el análisis en el módulo Análisis IA primero.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {patients.map((row) => {
            const p = row.paciente
            const pred = row.ultima_prediccion as Record<string, unknown> | null
            return (
              <button key={p.id} type="button" onClick={() => setSelected(row)}
                className="text-left rounded-xl border border-thorax-border bg-thorax-card p-5 hover:border-thorax-accent/40">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-thorax-text">{p.nombres} {p.apellidos}</p>
                    <p className="text-xs text-thorax-muted mt-1">DNI: {p.dni ?? '—'}</p>
                  </div>
                  <Users className="h-5 w-5 text-thorax-accent" />
                </div>
                {pred && (
                  <AppBadge variant={riskVariant(String(pred.nivel_riesgo))} className="mt-3">
                    {String(pred.clase_predicha)} — Riesgo {String(pred.nivel_riesgo)}
                  </AppBadge>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
