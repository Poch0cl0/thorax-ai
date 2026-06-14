type Props = {
  data: Record<string, unknown> | null
  title?: string
  compact?: boolean
  showDate?: boolean
}

const exposureLabels: Record<string, string> = {
  exposicion_humo: 'Exposición a humo',
  exposicion_asbesto: 'Exposición a asbesto',
  exposicion_radon: 'Exposición a radón',
  antecedente_familiar_cancer: 'Antecedente familiar de cáncer',
}

const symptomLabels: Record<string, string> = {
  tos_cronica: 'Tos crónica',
  hemoptisis: 'Hemoptisis',
  disnea: 'Disnea',
  dolor_toracico: 'Dolor torácico',
  perdida_peso: 'Pérdida de peso',
  fatiga: 'Fatiga',
  ronquera: 'Ronquera',
  infecciones_recurrentes: 'Infecciones recurrentes',
}

function boolVal(data: Record<string, unknown>, key: string): boolean {
  return Boolean(data[key])
}

export function ClinicalDataDisplay({
  data,
  title = 'Datos clínicos',
  compact = false,
  showDate = false,
}: Props) {
  if (!data) {
    return <p className="text-sm text-thorax-muted">Sin datos clínicos registrados.</p>
  }

  const activeExposures = Object.entries(exposureLabels).filter(([key]) => boolVal(data, key))
  const activeSymptoms = Object.entries(symptomLabels).filter(([key]) => boolVal(data, key))
  const fecha = data.fecha_registro
    ? new Date(String(data.fecha_registro)).toLocaleString('es-PE')
    : null

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {title ? (
        <h4 className={`font-semibold text-thorax-text ${compact ? 'text-sm' : 'text-sm mb-1'}`}>
          {title}
        </h4>
      ) : null}
      {showDate && fecha ? (
        <p className="text-xs text-thorax-muted">{fecha}</p>
      ) : null}

      <div className={`text-sm text-thorax-text ${compact ? 'space-y-1' : 'space-y-2'}`}>
        {data.edad != null && (
          <p>
            <span className="text-thorax-muted">Edad:</span> {String(data.edad)} años
          </p>
        )}
        {data.fumador != null && (
          <p>
            <span className="text-thorax-muted">Fumador:</span>{' '}
            {data.fumador ? 'Sí' : 'No'}
          </p>
        )}
        {data.paquetes_anio != null && (
          <p>
            <span className="text-thorax-muted">Paquetes/año:</span> {String(data.paquetes_anio)}
          </p>
        )}

        {activeExposures.length > 0 && (
          <div className="pt-1">
            {!compact && (
              <p className="text-xs font-semibold uppercase tracking-wide text-thorax-muted mb-1">
                Exposiciones y antecedentes
              </p>
            )}
            <div className="flex flex-wrap gap-1">
              {activeExposures.map(([, label]) => (
                <span
                  key={label}
                  className="rounded-full bg-thorax-card-alt px-2 py-0.5 text-xs text-thorax-text ring-1 ring-thorax-border"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {activeSymptoms.length > 0 && (
          <div className="pt-1">
            {!compact && (
              <p className="text-xs font-semibold uppercase tracking-wide text-thorax-muted mb-1">
                Síntomas presentes
              </p>
            )}
            <div className="flex flex-wrap gap-1">
              {activeSymptoms.map(([, label]) => (
                <span
                  key={label}
                  className="rounded-full bg-thorax-accent/15 px-2 py-0.5 text-xs text-thorax-accent"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {activeSymptoms.length === 0 && activeExposures.length === 0 && data.fumador === false && (
          <p className="text-xs text-thorax-muted italic">Sin síntomas ni exposiciones reportadas.</p>
        )}

        {data.observaciones ? (
          <p className={`text-thorax-muted ${compact ? 'pt-1' : 'pt-2'}`}>
            <span className="text-thorax-text">Observaciones:</span>{' '}
            {String(data.observaciones)}
          </p>
        ) : null}
      </div>
    </div>
  )
}
