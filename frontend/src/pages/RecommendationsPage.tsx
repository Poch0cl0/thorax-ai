import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { FileText, Loader2, Save, ArrowLeft } from 'lucide-react'
import { apiFetch } from '../services/api'
import { useAuth } from '../context/useAuth'

export function RecommendationsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const patientId = searchParams.get('patient_id')
  const predictionId = searchParams.get('prediction_id')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendationMarkdown, setRecommendationMarkdown] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (patientId && predictionId && !recommendationMarkdown) {
      generateRecommendation()
    }
  }, [patientId, predictionId])

  async function generateRecommendation() {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<any>(`/api/v1/recomendaciones/generar`, {
        method: 'POST',
        body: JSON.stringify({
          prediction_id: Number(predictionId),
          patient_id: Number(patientId),
          medico_id: user?.id || 1,
          custom_prompt: ''
        })
      })
      setRecommendationMarkdown(res.contenido_markdown)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar recomendación')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await apiFetch<any>('/api/v1/recomendaciones', {
        method: 'POST',
        body: JSON.stringify({
          prediction_id: Number(predictionId),
          patient_id: Number(patientId),
          medico_id: user?.id || 1,
          contenido_markdown: recommendationMarkdown
        })
      })
      alert('Recomendación guardada con éxito')
      navigate(`/patients/${patientId}`)
    } catch (err) {
      alert('Error al guardar la recomendación')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 text-thorax-muted hover:text-thorax-text bg-thorax-card rounded-lg border border-thorax-border">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-thorax-text flex items-center gap-2">
            <FileText className="h-6 w-6 text-thorax-accent" /> Recomendación IA
          </h1>
          <p className="mt-2 text-sm text-thorax-muted">Edita y confirma la recomendación generada por el modelo.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-thorax-muted bg-thorax-card rounded-xl border border-thorax-border">
          <Loader2 className="h-8 w-8 animate-spin text-thorax-accent mb-4" />
          <p>Generando recomendación basándose en el historial y el análisis...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-thorax-danger bg-thorax-card rounded-xl border border-thorax-border">
          <p>{error}</p>
          <button onClick={generateRecommendation} className="mt-4 px-4 py-2 bg-thorax-accent text-slate-900 font-semibold rounded-lg">
            Reintentar
          </button>
        </div>
      ) : (
        <div className="bg-thorax-card rounded-xl border border-thorax-border overflow-hidden">
          <div className="p-4 border-b border-thorax-border/60 bg-thorax-bg-deep">
            <h3 className="font-semibold text-thorax-text text-sm">Contenido (Markdown)</h3>
          </div>
          <div className="p-4">
            <textarea
              value={recommendationMarkdown}
              onChange={e => setRecommendationMarkdown(e.target.value)}
              rows={20}
              className="w-full bg-thorax-bg-deep border border-thorax-border rounded-xl p-4 text-sm text-thorax-text outline-none focus:border-thorax-accent focus:ring-1 focus:ring-thorax-accent font-mono resize-y"
            />
          </div>
          <div className="p-4 border-t border-thorax-border/60 bg-thorax-bg-deep flex justify-end">
            <button 
              onClick={handleSave} 
              disabled={saving || !recommendationMarkdown}
              className="inline-flex items-center gap-2 bg-thorax-accent text-slate-900 px-6 py-2.5 rounded-xl font-semibold hover:bg-thorax-accent-hover disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar Recomendación
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
