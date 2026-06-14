import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'

type Props = {
  onSubmit: (email: string, password: string) => Promise<void>
  error: string | null
  loading: boolean
}

export function LoginForm({ onSubmit, error, loading }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true'

  return (
    <form
      className="mt-8 space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        void onSubmit(email, password)
      }}
    >
      <label className="block text-sm font-medium text-thorax-text">
        Correo electrónico
        <span className="relative mt-2 block">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-thorax-muted" strokeWidth={1.75} />
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="doctor@hospital.com"
            required
            className="w-full rounded-xl border border-thorax-border bg-thorax-bg-deep py-3 pl-10 pr-3 text-sm text-thorax-text placeholder:text-thorax-muted outline-none focus:border-thorax-accent focus:ring-1 focus:ring-thorax-accent"
          />
        </span>
      </label>
      <label className="block text-sm font-medium text-thorax-text">
        Contraseña
        <span className="relative mt-2 block">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-thorax-muted" strokeWidth={1.75} />
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={skipAuth ? 1 : 8}
            className="w-full rounded-xl border border-thorax-border bg-thorax-bg-deep py-3 pl-10 pr-10 text-sm text-thorax-text outline-none focus:border-thorax-accent focus:ring-1 focus:ring-thorax-accent"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-thorax-muted hover:text-thorax-text"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        </span>
      </label>

      {skipAuth && (
        <div className="rounded-xl border border-thorax-border bg-thorax-bg-deep px-4 py-3 text-xs leading-relaxed text-amber-200/90">
          SKIP_AUTH activo: la contraseña no se valida en servidor.
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-thorax-danger">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-thorax-accent py-3 text-sm font-semibold text-slate-900 shadow hover:bg-thorax-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Entrando…' : 'Iniciar Sesión'}
      </button>
      <p className="text-center text-[11px] text-thorax-muted">
        Versión 1.0 · Todas tus sesiones son seguras y encriptadas
      </p>
    </form>
  )
}
