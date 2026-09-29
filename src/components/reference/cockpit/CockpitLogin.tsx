"use client"

/**
 * REFERENCE.COM — Portail de connexion du cockpit rédaction.
 * Écran sombre plein cadre : tant que la session administrateur n'est pas
 * ouverte, aucune donnée ni aucun écran de gestion n'est chargé.
 */

import * as React from "react"

import { ArrowLeft, KeyRound, Loader2, Lock, TriangleAlert } from "lucide-react"

import { Logo } from "@/components/reference/Logo"
import { fetchJson } from "@/components/reference/lib"
import type { Navigate } from "@/components/reference/types"

export function CockpitLogin({
  navigate,
  onSuccess,
}: {
  navigate: Navigate
  onSuccess: () => void
}) {
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (pending || !password) return
    setPending(true)
    setError(null)
    try {
      await fetchJson("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible")
      setPassword("")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* En-tête de marque */}
        <div className="flex flex-col items-center text-center">
          <Logo className="h-9" />
          <p className="kicker mt-5 text-brand-red">Espace rédaction</p>
          <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-white">
            Accès au cockpit
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Cet espace est réservé à la rédaction. Saisissez le mot de passe
            administrateur pour déverrouiller la gestion du site.
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor="cockpit-password"
              className="kicker block text-zinc-400"
            >
              Mot de passe administrateur
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
                aria-hidden="true"
              />
              <input
                id="cockpit-password"
                name="password"
                type="password"
                autoComplete="current-password"
                autoFocus
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={pending}
                className="h-11 w-full rounded-none border border-zinc-700 bg-zinc-900 pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-white disabled:opacity-60"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              className="flex items-start gap-2 border border-brand-red/40 bg-brand-red/10 px-3 py-2.5 text-[13px] font-medium text-red-300"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending || !password}
            className="flex min-h-11 w-full items-center justify-center gap-2 bg-brand-red px-4 text-sm font-bold uppercase tracking-[0.12em] text-white outline-none transition-all hover:bg-[#c81526] focus-visible:ring-[3px] focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <KeyRound className="size-4" aria-hidden="true" />
            )}
            {pending ? "Vérification…" : "Déverrouiller"}
          </button>
        </form>

        {/* Retour au site public */}
        <button
          type="button"
          onClick={() => navigate({ type: "home" })}
          className="mt-8 flex min-h-10 w-full items-center justify-center gap-2 border border-zinc-700 px-3 text-sm font-medium text-zinc-300 outline-none transition-colors hover:border-white hover:bg-white hover:text-zinc-950 focus-visible:ring-[3px] focus-visible:ring-white/40"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Retour au site public
        </button>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-zinc-600">
          10 tentatives par tranche de 10 minutes. En cas d'oubli, régénérez
          ADMIN_PASSWORD dans le fichier .env du serveur.
        </p>
      </div>
    </div>
  )
}
