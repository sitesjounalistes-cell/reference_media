"use client"

import * as React from "react"

import { CheckCircle2, Loader2, Send } from "lucide-react"

import { cn } from "@/lib/utils"
import { fetchJson } from "@/components/reference/lib"
import { useI18n } from "@/components/reference/lang-context"
import { toast } from "@/hooks/use-toast"
import type { NewsletterResponse } from "@/components/reference/types"

interface NewsletterFormProps {
  /** « default » (clair) ou « onBlue » (posé sur un fond marine de marque). */
  variant?: "default" | "onBlue"
  /** Empile champ + bouton verticalement (colonnes étroites, pied de page). */
  stacked?: boolean
  className?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Mini formulaire d’inscription à la newsletter (accueil, pied de page…). */
export function NewsletterForm({
  variant = "default",
  stacked = false,
  className,
}: NewsletterFormProps) {
  const inputId = React.useId()
  const { t } = useI18n()
  const [email, setEmail] = React.useState("")
  const [status, setStatus] = React.useState<"idle" | "loading" | "success">("idle")
  const [inlineError, setInlineError] = React.useState<string | null>(null)
  const onBlue = variant === "onBlue"

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = email.trim()
    if (!EMAIL_RE.test(value)) {
      setInlineError(t("newsletter.invalid"))
      toast({
        variant: "destructive",
        title: t("newsletter.invalid"),
        description: t("newsletter.check"),
      })
      return
    }
    setInlineError(null)
    setStatus("loading")
    try {
      const res = await fetchJson<NewsletterResponse>("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      })
      setStatus("success")
      setEmail("")
      toast({
        title: t("newsletter.confirmed"),
        description: res.message || t("newsletter.fallback"),
      })
    } catch (err) {
      setStatus("idle")
      const description =
        err instanceof Error ? err.message : t("newsletter.error")
      setInlineError(description)
      toast({
        variant: "destructive",
        title: t("newsletter.failed"),
        description,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)} noValidate>
      <div className={cn(stacked ? "flex flex-col gap-2" : "flex gap-2")}>
        <label htmlFor={inputId} className="sr-only">
          {t("newsletter.placeholder")}
        </label>
        <input
          id={inputId}
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.fr"
          autoComplete="email"
          disabled={status === "loading"}
          aria-invalid={Boolean(inlineError)}
          className={cn(
            "h-11 min-w-0 flex-1 border-2 px-3 text-sm outline-none transition-colors focus-visible:ring-[3px] disabled:opacity-60",
            onBlue
              ? "border-white/25 bg-white/10 text-white placeholder:text-zinc-400 focus:border-white focus-visible:ring-white/25"
              : "border-zinc-300 bg-background text-foreground placeholder:text-zinc-400 focus:border-brand-blue focus-visible:ring-ring/25",
            inlineError && "border-brand-red!"
          )}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className={cn(
            "kicker inline-flex h-11 shrink-0 items-center justify-center gap-2 px-5 text-white outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60",
            stacked && "w-full",
            onBlue
              ? "bg-brand-red hover:bg-[#c8101f] focus-visible:ring-white/50"
              : "bg-brand-blue hover:bg-[#1449a8]"
          )}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {t("newsletter.sending")}
            </>
          ) : (
            <>
              <Send className="size-4" aria-hidden="true" />
              {t("newsletter.subscribe")}
            </>
          )}
        </button>
      </div>
      <div aria-live="polite" className="mt-2 min-h-5 text-xs">
        {status === "success" ? (
          <p
            className={cn(
              "inline-flex items-center gap-1.5 font-medium",
              onBlue ? "text-white" : "text-brand-blue"
            )}
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            {t("newsletter.welcome")}
          </p>
        ) : inlineError ? (
          <p className={onBlue ? "text-white/90" : "text-destructive"}>{inlineError}</p>
        ) : null}
      </div>
    </form>
  )
}
