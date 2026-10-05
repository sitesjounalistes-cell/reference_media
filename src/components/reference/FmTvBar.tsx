"use client"

/**
 * REFERENCE.COM — FM & TV : bibliothèque de contenus structurés.
 * Barre flottante (si activée au cockpit) ouvrant un panneau plein écran :
 * FM → podcasts / chroniques / interviews (lecteurs audio en ligne) ;
 * TV → reportages / émissions (lecteurs vidéo). Le flux "live" reste
 * disponible en tête de panneau si une URL de flux est configurée.
 */
import * as React from "react"

import { Mic, Play, Radio, Tv, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useFetch } from "@/components/reference/lib"
import type { SiteSettingsResponse } from "@/components/reference/types"

interface BroadcastDto {
  id: string
  kind: string
  section: string
  title: string
  description: string
  mediaUrl: string
  duration: number | null
  featured: boolean
  publishedAt: string
}

const SECTION_LABELS: Record<string, string> = {
  podcast: "Podcasts",
  chronique: "Chroniques",
  interview: "Interviews",
  reportage: "Reportages",
  emission: "Émissions",
}

const FM_SECTIONS = ["podcast", "chronique", "interview"]
const TV_SECTIONS = ["reportage", "emission"]

export function FmTvBar() {
  const { data } = useFetch<SiteSettingsResponse>("/api/settings")
  const settings = data?.settings ?? {}
  const fmOn = settings.fmEnabled === "true"
  const tvOn = settings.tvEnabled === "true"
  const fmUrl = (settings.fmStreamUrl ?? "").trim()
  const tvUrl = (settings.tvStreamUrl ?? "").trim()

  const [panel, setPanel] = React.useState<null | "FM" | "TV">(null)

  if (!fmOn && !tvOn) return null

  return (
    <>
      {/* Barre flottante */}
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-1.5 border border-border bg-background/95 p-1.5 shadow-lg backdrop-blur-sm">
        {fmOn ? (
          <button
            type="button"
            onClick={() => setPanel("FM")}
            title="Radio FM — podcasts, chroniques, interviews"
            className="inline-flex h-9 items-center gap-2 px-3 text-xs font-bold uppercase tracking-[0.12em] text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Radio className="size-4" aria-hidden="true" />
            {settings.fmLabel?.trim() || "FM"}
          </button>
        ) : null}
        {tvOn ? (
          <button
            type="button"
            onClick={() => setPanel("TV")}
            title="TV — reportages et émissions"
            className="inline-flex h-9 items-center gap-2 px-3 text-xs font-bold uppercase tracking-[0.12em] text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Tv className="size-4" aria-hidden="true" />
            {settings.tvLabel?.trim() || "TV"}
          </button>
        ) : null}
      </div>

      {panel ? <BroadcastPanel mode={panel} liveUrl={panel === "FM" ? fmUrl : tvUrl} liveLabel={(panel === "FM" ? settings.fmLabel : settings.tvLabel)?.trim() || panel} onClose={() => setPanel(null)} /> : null}
    </>
  )
}

function BroadcastPanel({
  mode,
  liveUrl,
  liveLabel,
  onClose,
}: {
  mode: "FM" | "TV"
  liveUrl: string
  liveLabel: string
  onClose: () => void
}) {
  const isTv = mode === "TV"
  const { data } = useFetch<{ broadcasts: BroadcastDto[] }>(
    `/api/broadcasts?kind=${isTv ? "VIDEO" : "AUDIO"}`
  )
  const items = data?.broadcasts ?? []
  const sections = isTv ? TV_SECTIONS : FM_SECTIONS

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isTv ? "TV" : "Radio FM"}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/90 p-0 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-4xl border border-border bg-background shadow-2xl sm:max-h-[90vh] sm:overflow-y-auto nice-scrollbar"
        onClick={(event) => event.stopPropagation()}
      >
        {/* En-tête */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3 sm:px-6">
          <p className="kicker flex items-center gap-2 text-brand-red">
            {isTv ? <Tv className="size-4" aria-hidden="true" /> : <Radio className="size-4" aria-hidden="true" />}
            {isTv ? "TV" : "Radio FM"} — REFERENCE.COM
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="inline-flex size-9 items-center justify-center text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="px-4 py-5 sm:px-6">
          {/* Flux live en direct (si configuré) */}
          {liveUrl ? (
            <section className="mb-8 border-l-[3px] border-brand-red pl-4">
              <p className="kicker flex items-center gap-2 text-brand-red">
                <span aria-hidden="true" className="pulse-dot size-1.5 bg-brand-red" />
                En direct
              </p>
              <h2 className="headline mt-1 text-xl font-bold">{liveLabel}</h2>
              {isTv ? (
                <video src={liveUrl} controls playsInline className="mt-3 aspect-video w-full max-w-2xl bg-black" />
              ) : (
                <audio src={liveUrl} controls preload="none" className="mt-3 w-full max-w-xl" />
              )}
            </section>
          ) : null}

          {items.length === 0 && !liveUrl ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Les premiers {isTv ? "reportages" : "podcasts"} arrivent bientôt.
            </p>
          ) : null}

          {/* Sections éditoriales */}
          {sections.map((section) => {
            const sectionItems = items.filter((item) => item.section === section)
            if (sectionItems.length === 0) return null
            return (
              <section key={section} className="mb-8" aria-labelledby={`bc-${section}`}>
                <div className="mb-3 flex items-center gap-3 border-b-2 border-foreground pb-2">
                  <Mic className="size-4 text-brand-red" aria-hidden="true" />
                  <h3 id={`bc-${section}`} className="headline text-lg font-bold">
                    {SECTION_LABELS[section]}
                  </h3>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {sectionItems.length}
                  </span>
                </div>
                <ul className="space-y-4">
                  {sectionItems.map((item) => (
                    <li key={item.id} className="border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-serif text-base font-bold leading-snug">
                            {item.featured ? <span className="mr-2 bg-brand-red px-1.5 py-0.5 align-middle text-[9px] font-bold uppercase tracking-widest text-white">À la une</span> : null}
                            {item.title}
                          </p>
                          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                        {item.duration ? (
                          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                            {item.duration} min
                          </span>
                        ) : null}
                      </div>
                      {isTv ? (
                        <video
                          src={item.mediaUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="mt-3 aspect-video w-full bg-black"
                        />
                      ) : (
                        <audio src={item.mediaUrl} controls preload="metadata" className="mt-3 w-full" />
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
