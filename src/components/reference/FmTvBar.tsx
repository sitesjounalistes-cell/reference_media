"use client"

/**
 * REFERENCE.COM — Barre FM / TV : lecteur radio et player TV flottants,
 * pilotés depuis le cockpit (paramètres fmEnabled / tvEnabled + flux).
 * Absente de l'interface tant que les deux fonctions sont désactivées.
 */
import * as React from "react"

import { Radio, Tv, X } from "lucide-react"

import { useFetch } from "@/components/reference/lib"
import type { SiteSettingsResponse } from "@/components/reference/types"

export function FmTvBar() {
  const { data } = useFetch<SiteSettingsResponse>("/api/settings")
  const settings = data?.settings ?? {}

  const fmOn = settings.fmEnabled === "true"
  const tvOn = settings.tvEnabled === "true"
  const fmUrl = (settings.fmStreamUrl ?? "").trim()
  const tvUrl = (settings.tvStreamUrl ?? "").trim()

  const audioRef = React.useRef<HTMLAudioElement>(null)
  const [fmPlaying, setFmPlaying] = React.useState(false)
  const [tvOpen, setTvOpen] = React.useState(false)

  // Coupure propre quand un flux est retiré en cours de lecture.
  React.useEffect(() => {
    if (fmPlaying && !fmOn) {
      audioRef.current?.pause()
      setFmPlaying(false)
    }
    if (tvOpen && !tvOn) setTvOpen(false)
  }, [fmOn, tvOn, fmPlaying, tvOpen])

  const toggleFm = () => {
    const audio = audioRef.current
    if (!audio) return
    if (fmPlaying) {
      audio.pause()
      setFmPlaying(false)
    } else {
      audio.currentTime = 0
      void audio.play().then(() => setFmPlaying(true)).catch(() => setFmPlaying(false))
    }
  }

  if (!fmOn && !tvOn) return null

  return (
    <>
      {/* Flux audio FM (déclaré hors rendu conditionnel pour un seul élément) */}
      {fmOn && fmUrl ? (
        <audio ref={audioRef} src={fmUrl} preload="none" aria-hidden="true" />
      ) : null}

      {/* Barre flottante en bas à gauche */}
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-1.5 border border-border bg-background/95 p-1.5 shadow-lg backdrop-blur-sm">
        {fmOn && fmUrl ? (
          <button
            type="button"
            onClick={toggleFm}
            aria-pressed={fmPlaying}
            title={fmPlaying ? "Interrompre la radio" : "Écouter la radio"}
            className={`inline-flex h-9 items-center gap-2 px-3 text-xs font-bold uppercase tracking-[0.12em] outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
              fmPlaying ? "bg-brand-red text-white" : "text-foreground hover:bg-muted"
            }`}
          >
            <Radio className={`size-4 ${fmPlaying ? "animate-pulse" : ""}`} aria-hidden="true" />
            {settings.fmLabel?.trim() || "FM"}
          </button>
        ) : null}
        {tvOn && tvUrl ? (
          <button
            type="button"
            onClick={() => setTvOpen(true)}
            title="Regarder la chaîne TV"
            className="inline-flex h-9 items-center gap-2 px-3 text-xs font-bold uppercase tracking-[0.12em] text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Tv className="size-4" aria-hidden="true" />
            {settings.tvLabel?.trim() || "TV"}
          </button>
        ) : null}
      </div>

      {/* Fenêtre TV */}
      {tvOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={settings.tvLabel?.trim() || "TV"}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 p-4 backdrop-blur-sm"
          onClick={() => setTvOpen(false)}
        >
          <div
            className="w-full max-w-4xl border border-border bg-background shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <p className="kicker flex items-center gap-2 text-brand-red">
                <Tv className="size-4" aria-hidden="true" />
                {settings.tvLabel?.trim() || "TV"} — REFERENCE.COM
              </p>
              <button
                type="button"
                onClick={() => setTvOpen(false)}
                aria-label="Fermer"
                className="inline-flex size-8 items-center justify-center text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <video
              src={tvUrl}
              controls
              autoPlay
              playsInline
              className="aspect-video w-full bg-black"
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
