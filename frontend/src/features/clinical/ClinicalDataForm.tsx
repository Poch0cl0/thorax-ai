export type ClinicalDataFormValues = {
  edad: string
  fumador: boolean
  paquetes_anio: string
  exposicion_humo: boolean
  exposicion_asbesto: boolean
  exposicion_radon: boolean
  antecedente_familiar_cancer: boolean
  tos_cronica: boolean
  hemoptisis: boolean
  disnea: boolean
  dolor_toracico: boolean
  perdida_peso: boolean
  fatiga: boolean
  ronquera: boolean
  infecciones_recurrentes: boolean
  observaciones: string
}

export const emptyClinicalData: ClinicalDataFormValues = {
  edad: '',
  fumador: false,
  paquetes_anio: '',
  exposicion_humo: false,
  exposicion_asbesto: false,
  exposicion_radon: false,
  antecedente_familiar_cancer: false,
  tos_cronica: false,
  hemoptisis: false,
  disnea: false,
  dolor_toracico: false,
  perdida_peso: false,
  fatiga: false,
  ronquera: false,
  infecciones_recurrentes: false,
  observaciones: '',
}

type Props = {
  values: ClinicalDataFormValues
  onChange: (values: ClinicalDataFormValues) => void
  disabled?: boolean
  edadReadOnly?: boolean
}

function BoolField({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-thorax-text">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-thorax-border bg-thorax-bg-deep text-thorax-accent focus:ring-thorax-accent"
      />
      {label}
    </label>
  )
}

export function ClinicalDataForm({ values, onChange, disabled, edadReadOnly }: Props) {
  function set<K extends keyof ClinicalDataFormValues>(key: K, val: ClinicalDataFormValues[K]) {
    onChange({ ...values, [key]: val })
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-thorax-border bg-thorax-bg-deep/50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-thorax-text">Factores de riesgo</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-thorax-muted">
              Edad {edadReadOnly ? '(automática)' : ''}
            </label>
            <input
              type="number"
              min={0}
              max={120}
              value={values.edad}
              disabled={disabled}
              readOnly={edadReadOnly}
              onChange={(e) => set('edad', e.target.value)}
              className={`mt-1 w-full rounded-lg border border-thorax-border px-3 py-2 text-sm text-thorax-text outline-none focus:border-thorax-accent ${
                edadReadOnly
                  ? 'cursor-not-allowed bg-thorax-card-alt text-thorax-muted'
                  : 'bg-thorax-bg-deep'
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-thorax-muted">Paquetes/año (tabaco)</label>
            <input
              type="number"
              step="0.1"
              min={0}
              value={values.paquetes_anio}
              disabled={disabled}
              onChange={(e) => set('paquetes_anio', e.target.value)}
              className="mt-1 w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text outline-none focus:border-thorax-accent"
            />
          </div>
          <BoolField label="Fumador" checked={values.fumador} disabled={disabled} onChange={(v) => set('fumador', v)} />
          <BoolField label="Exposición a humo" checked={values.exposicion_humo} disabled={disabled} onChange={(v) => set('exposicion_humo', v)} />
          <BoolField label="Exposición a asbesto" checked={values.exposicion_asbesto} disabled={disabled} onChange={(v) => set('exposicion_asbesto', v)} />
          <BoolField label="Exposición a radón" checked={values.exposicion_radon} disabled={disabled} onChange={(v) => set('exposicion_radon', v)} />
          <BoolField label="Antecedente familiar de cáncer" checked={values.antecedente_familiar_cancer} disabled={disabled} onChange={(v) => set('antecedente_familiar_cancer', v)} />
        </div>
      </section>

      <section className="rounded-xl border border-thorax-border bg-thorax-bg-deep/50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-thorax-text">Síntomas</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <BoolField label="Tos crónica" checked={values.tos_cronica} disabled={disabled} onChange={(v) => set('tos_cronica', v)} />
          <BoolField label="Hemoptisis" checked={values.hemoptisis} disabled={disabled} onChange={(v) => set('hemoptisis', v)} />
          <BoolField label="Disnea" checked={values.disnea} disabled={disabled} onChange={(v) => set('disnea', v)} />
          <BoolField label="Dolor torácico" checked={values.dolor_toracico} disabled={disabled} onChange={(v) => set('dolor_toracico', v)} />
          <BoolField label="Pérdida de peso" checked={values.perdida_peso} disabled={disabled} onChange={(v) => set('perdida_peso', v)} />
          <BoolField label="Fatiga" checked={values.fatiga} disabled={disabled} onChange={(v) => set('fatiga', v)} />
          <BoolField label="Ronquera" checked={values.ronquera} disabled={disabled} onChange={(v) => set('ronquera', v)} />
          <BoolField label="Infecciones recurrentes" checked={values.infecciones_recurrentes} disabled={disabled} onChange={(v) => set('infecciones_recurrentes', v)} />
        </div>
      </section>

      <section>
        <label className="block text-xs font-medium text-thorax-muted">Observaciones</label>
        <textarea
          rows={3}
          value={values.observaciones}
          disabled={disabled}
          onChange={(e) => set('observaciones', e.target.value)}
          className="mt-1 w-full rounded-lg border border-thorax-border bg-thorax-bg-deep px-3 py-2 text-sm text-thorax-text outline-none focus:border-thorax-accent"
          placeholder="Notas adicionales de la consulta…"
        />
      </section>
    </div>
  )
}

export function clinicalDataToPayload(
  values: ClinicalDataFormValues,
  pacienteId: number,
  medicoId: number,
  citaId?: number,
) {
  return {
    paciente_id: pacienteId,
    medico_id: medicoId,
    cita_id: citaId ?? null,
    edad: values.edad ? Number(values.edad) : null,
    fumador: values.fumador,
    paquetes_anio: values.paquetes_anio ? Number(values.paquetes_anio) : null,
    exposicion_humo: values.exposicion_humo,
    exposicion_asbesto: values.exposicion_asbesto,
    exposicion_radon: values.exposicion_radon,
    antecedente_familiar_cancer: values.antecedente_familiar_cancer,
    tos_cronica: values.tos_cronica,
    hemoptisis: values.hemoptisis,
    disnea: values.disnea,
    dolor_toracico: values.dolor_toracico,
    perdida_peso: values.perdida_peso,
    fatiga: values.fatiga,
    ronquera: values.ronquera,
    infecciones_recurrentes: values.infecciones_recurrentes,
    observaciones: values.observaciones.trim() || null,
  }
}
