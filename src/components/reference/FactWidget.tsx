"use client"

import * as React from "react"

import { motion } from "framer-motion"
import { RefreshCw } from "lucide-react"

import { cn } from "@/lib/utils"
import { useI18n, useI18nFetch } from "@/components/reference/lang-context"
import type { FactResponse } from "@/components/reference/types"

interface FactWidgetProps {
  className?: string
}

/** « Le saviez-vous ? » : encart marine, anecdote aléatoire actualisable. */
export function FactWidget({ className }: FactWidgetProps) {
  const { t } = useI18n()
  const { data, error, loading, retry } = useI18nFetch<FactResponse>(
    "/api/facts/random"
  )
  const [spin, setSpin] = React.useState(0)

  const refresh = () => {
    setSpin((s) => s + 1)
    retry()
  }

  return (
    <section
      aria-labelledby="fact-heading"
      className={cn("band-navy p-6 text-white", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <p id="fact-heading" className="kicker flex items-center gap-2 text-white">
          <span
            aria-hidden="true"
            className="pulse-dot inline-block size-2 shrink-0 bg-brand-red"
          />
          {t("fact.title")}
        </p>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          aria-label={t("fact.title")}
          className="inline-flex size-9 shrink-0 items-center justify-center text-zinc-400 outline-none transition-colors hover:text-white focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-white/60 disabled:opacity-60"
        >
          <motion.span
            className="inline-flex"
            animate={{ rotate: spin * 360 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
          </motion.span>
        </button>
      </div>

      {loading ? (
        <div className="mt-4 space-y-2" aria-live="polite">
          <div className="h-4 w-full animate-pulse bg-white/10" />
          <div className="h-4 w-11/12 animate-pulse bg-white/10" />
          <div className="h-4 w-2/3 animate-pulse bg-white/10" />
        </div>
      ) : error ? (
        <p className="mt-4 text-sm text-zinc-300" role="alert">
          Impossible de charger l’anecdote.{" "}
          <button
            type="button"
            onClick={retry}
            className="font-medium text-[#8fb4f2] underline-offset-4 hover:underline"
          >
            Réessayer
          </button>
        </p>
      ) : data?.fact ? (
        <div className="mt-4" aria-live="polite">
          <motion.p
            key={data.fact.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="headline text-lg font-semibold leading-relaxed text-white"
          >
            {data.fact.content}
          </motion.p>
          {data.fact.source ? (
            <p className="mt-3 text-xs text-zinc-400">
              Source : {data.fact.source}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-400">
          Aucune anecdote disponible pour le moment.
        </p>
      )}

      <div aria-hidden="true" className="rule-brand mt-5 h-1 w-16" />
    </section>
  )
}
