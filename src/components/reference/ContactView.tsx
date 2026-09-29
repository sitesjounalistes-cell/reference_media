"use client"

import * as React from "react"

import { motion } from "framer-motion"
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  PenLine,
  Send,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  channelHref,
  fetchJson,
  getChannelIcon,
  getSocialIcon,
  getSocialLabel,
  useFetch,
} from "@/components/reference/lib"
import { Logo } from "@/components/reference/Logo"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { SiteSettingsResponse } from "@/components/reference/types"

/* ------------------------------ Sujets du form ----------------------------- */

const SUBJECTS = [
  { value: "redaction", label: "Rédaction — question sur un article" },
  { value: "correction", label: "Correction — signaler une erreur" },
  { value: "partenariat", label: "Partenariat éditorial" },
  { value: "publicite", label: "Publicité & sponsorship" },
  { value: "droits", label: "Droits & réutilisation" },
  { value: "autre", label: "Autre demande" },
] as const

type SubjectValue = (typeof SUBJECTS)[number]["value"]

const SUBJECT_REDACTION = new Set<string>(SUBJECTS.map((s) => s.value))

/* ------------------------------ Canaux & champs ----------------------------- */

/** Champs : filet 2 px, focus bleu de marque, cible 44 px. */
const FIELD_CLASS =
  "h-11 min-h-11 w-full border-2 border-border bg-background focus-visible:border-brand-blue focus-visible:ring-brand-blue/30"

/** Entrée d'annuaire sur bande marine : icône carrée, libellé, valeur. */
function NavyChannelEntry({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon
  label: string
  value: string
  href?: string
}) {
  return (
    <div className="flex items-start gap-4 border-b border-white/10 py-4 first:pt-0 last:border-b-0 last:pb-0">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center bg-white/15 text-white"
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            className="mt-1 inline-block break-words text-[15px] font-semibold text-white outline-none transition-colors hover:text-[#8fb4f2] focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {value}
          </a>
        ) : (
          <p className="mt-1 break-words text-[15px] font-semibold text-white">
            {value}
          </p>
        )}
      </div>
    </div>
  )
}

/** Vue « Contact » : formulaire rédaction + annuaire marine piloté par le cockpit. */
export function ContactView({ initialSubject }: { initialSubject?: string }) {
  const inputId = React.useId()

  // Annuaire de la rédaction piloté depuis le cockpit (GET /api/settings).
  const settingsState = useFetch<SiteSettingsResponse>("/api/settings")
  const channels = React.useMemo(
    () =>
      (settingsState.data?.channels ?? [])
        .filter((channel) => channel.visible)
        .sort((a, b) => a.order - b.order),
    [settingsState.data]
  )
  const socials = React.useMemo(
    () =>
      (settingsState.data?.socials ?? [])
        .filter((social) => social.visible)
        .sort((a, b) => a.order - b.order),
    [settingsState.data]
  )
  const channelsLoading = settingsState.loading && channels.length === 0
  const quickEmail = channels.find((channel) => channel.type === "EMAIL")
  const quickHours = channels.find((channel) => channel.type === "HOURS")

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [subject, setSubject] = React.useState<SubjectValue | "">(
    initialSubject && SUBJECT_REDACTION.has(initialSubject)
      ? (initialSubject as SubjectValue)
      : ""
  )
  const [message, setMessage] = React.useState("")
  const [status, setStatus] = React.useState<"idle" | "loading" | "success">("idle")
  const [formError, setFormError] = React.useState<string | null>(null)

  const remaining = 2000 - message.length

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // Validations express côté client (le serveur revérifie tout).
    if (name.trim().length < 2) {
      setFormError("Veuillez indiquer votre nom (2 caractères minimum).")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setFormError("Veuillez saisir une adresse e-mail valide.")
      return
    }
    if (!subject || !SUBJECT_REDACTION.has(subject)) {
      setFormError("Veuillez sélectionner un sujet.")
      return
    }
    if (message.trim().length < 10) {
      setFormError("Votre message doit contenir au moins 10 caractères.")
      return
    }

    setFormError(null)
    setStatus("loading")
    try {
      const res = await fetchJson<{ ok: boolean; message: string }>(
        "/api/contact",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            subject,
            message: message.trim(),
          }),
        }
      )
      setStatus("success")
      toast({
        title: "Message envoyé",
        description: res.message,
      })
    } catch (err) {
      setStatus("idle")
      const description =
        err instanceof Error ? err.message : "Une erreur est survenue, réessayez."
      setFormError(description)
      toast({
        variant: "destructive",
        title: "Envoi impossible",
        description,
      })
    }
  }

  const resetForm = () => {
    setName("")
    setEmail("")
    setSubject("")
    setMessage("")
    setFormError(null)
    setStatus("idle")
  }

  return (
    <div className="pb-4">
      {/* ------------------------------- En-tête ------------------------------ */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        aria-labelledby="contact-title"
        className="band-paper border-b border-zinc-200"
      >
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#c8102c]">
            <span aria-hidden="true" className="size-2 shrink-0 bg-brand-red" />
            Contact
          </p>
          <h1
            id="contact-title"
            className="headline mt-4 max-w-3xl text-3xl font-black leading-[1.08] tracking-tight text-zinc-950 md:text-5xl"
          >
            Écrire à la rédaction
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 md:text-lg">
            Une question sur un dossier, une erreur à signaler, un projet à nous
            proposer ? Nous lisons tout — et nous répondons à chaque message.
          </p>
          <div aria-hidden="true" className="rule-brand mt-8 h-1 w-24" />
        </div>
      </motion.header>

      {/* --------------------------- Corps principal -------------------------- */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-5">
        {/* --------------------------- Formulaire ---------------------------- */}
        <section aria-labelledby="contact-form-title" className="lg:col-span-3">
          <h2
            id="contact-form-title"
            className="headline text-xl font-bold tracking-tight md:text-2xl"
          >
            Formulaire de contact
          </h2>
          <div aria-hidden="true" className="rule-brand mt-3 h-1 w-16" />
          <p className="mt-4 text-sm text-muted-foreground">
            Les champs marqués d&apos;un astérisque (*) sont obligatoires.
          </p>

          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-8 border-l-[3px] border-brand-red bg-muted/50 p-6 md:p-8"
              role="status"
            >
              <CheckCircle2 className="size-8 text-brand-red" aria-hidden="true" />
              <h3 className="headline mt-4 text-xl font-bold">
                Message bien reçu
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Merci {name.trim().split(" ")[0] ? name.trim().split(" ")[0] : ""} !
                Votre demande a été transmise à la rédaction. Nous vous
                répondrons à l&apos;adresse{" "}
                <span className="font-medium text-foreground">{email}</span> sous
                48 h ouvrées.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="min-h-11 border-foreground px-5 font-semibold hover:bg-foreground hover:text-background"
                >
                  <PenLine aria-hidden="true" />
                  Écrire un autre message
                </Button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
              {/* Nom + e-mail */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`${inputId}-name`} className="kicker text-zinc-500">
                    Nom complet *
                  </Label>
                  <Input
                    id={`${inputId}-name`}
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom et prénom"
                    autoComplete="name"
                    maxLength={80}
                    disabled={status === "loading"}
                    aria-invalid={Boolean(formError && name.trim().length < 2)}
                    className={FIELD_CLASS}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${inputId}-email`} className="kicker text-zinc-500">
                    Adresse e-mail *
                  </Label>
                  <Input
                    id={`${inputId}-email`}
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.fr"
                    autoComplete="email"
                    maxLength={254}
                    disabled={status === "loading"}
                    className={FIELD_CLASS}
                  />
                </div>
              </div>

              {/* Sujet */}
              <div className="space-y-2">
                <Label htmlFor={`${inputId}-subject`} className="kicker text-zinc-500">
                  Sujet *
                </Label>
                <Select
                  value={subject}
                  onValueChange={(value) => setSubject(value as SubjectValue)}
                  disabled={status === "loading"}
                >
                  <SelectTrigger
                    id={`${inputId}-subject`}
                    aria-label="Choisir un sujet"
                    className={cn(
                      FIELD_CLASS,
                      "data-[size=default]:h-11 data-[placeholder]:text-muted-foreground"
                    )}
                  >
                    <SelectValue placeholder="Sélectionnez le motif de votre message" />
                  </SelectTrigger>
                  <SelectContent className="border">
                    {SUBJECTS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <div className="flex items-end justify-between gap-4">
                  <Label htmlFor={`${inputId}-message`} className="kicker text-zinc-500">
                    Message *
                  </Label>
                  <span
                    aria-live="polite"
                    className={cn(
                      "text-xs tabular-nums",
                      remaining < 0 ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {remaining} caractères restants
                  </span>
                </div>
                <Textarea
                  id={`${inputId}-message`}
                  name="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                  placeholder="Décrivez votre demande avec le plus de détails possible…"
                  rows={6}
                  maxLength={2000}
                  disabled={status === "loading"}
                  className="min-h-44 resize-y border-2 border-border bg-background focus-visible:border-brand-blue focus-visible:ring-brand-blue/30"
                />
              </div>

              {/* Erreur globale */}
              {formError ? (
                <p
                  role="alert"
                  className="border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {formError}
                </p>
              ) : null}

              {/* Note RGPD + envoi */}
              <div className="flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                  Vos données ne servent qu&apos;au traitement de votre demande.
                  Elles ne sont jamais transmises à des tiers.
                </p>
                <Button
                  type="submit"
                  disabled={status === "loading"}
                  className="min-h-11 bg-brand-red px-8 text-[11px] font-bold uppercase tracking-[0.16em] text-white hover:bg-[#c8102c]"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden="true" />
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      <Send aria-hidden="true" />
                      Envoyer le message
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </section>

        {/* ---------------------------- Annuaire ----------------------------- */}
        <aside aria-label="Coordonnées de la rédaction" className="lg:col-span-2">
          <div className="band-navy p-6 text-white md:p-8">
            <h2 className="headline text-xl font-bold tracking-tight text-white">
              Annuaire de la rédaction
            </h2>
            <div aria-hidden="true" className="rule-brand mt-3 h-1 w-16" />

            <div className="mt-6">
              {channelsLoading ? (
                /* Squelette sobre pendant le chargement de l'annuaire. */
                <div aria-hidden="true">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="border-b border-white/10 py-4 first:pt-0">
                      <span className="block h-2.5 w-24 animate-pulse bg-white/20" />
                      <span className="mt-3 block h-4 w-48 animate-pulse bg-white/20" />
                    </div>
                  ))}
                </div>
              ) : channels.length > 0 ? (
                channels.map((channel) => {
                  const Icon = getChannelIcon(channel.type)
                  return (
                    <NavyChannelEntry
                      key={channel.id}
                      icon={Icon}
                      label={channel.label}
                      value={channel.value}
                      href={channelHref(channel.type, channel.value) ?? undefined}
                    />
                  )
                })
              ) : (
                /* Rendu dégradé : API injoignable ou annuaire vide. */
                <p className="py-4 text-sm leading-relaxed text-zinc-300">
                  L&apos;annuaire est momentanément indisponible.
                  {settingsState.error ? (
                    <>
                      {" "}
                      <button
                        type="button"
                        onClick={settingsState.retry}
                        className="font-semibold text-[#8fb4f2] underline decoration-white/40 underline-offset-4 outline-none transition-colors hover:decoration-white focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        Réessayer
                      </button>
                    </>
                  ) : null}
                </p>
              )}
            </div>

            {/* Réseaux sociaux (réglages du cockpit) */}
            {socials.length > 0 ? (
              <div className="mt-6 border-t border-white/10 pt-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                  Nous suivre
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {socials.map((social) => {
                    const Icon = getSocialIcon(social.platform)
                    const label = getSocialLabel(social.platform)
                    return (
                      <a
                        key={social.id}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={label}
                        aria-label={label}
                        className="inline-flex size-10 items-center justify-center border border-white/20 text-white outline-none transition-colors hover:border-white hover:bg-white hover:text-[#0a1e3c] focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </a>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {/* Repères de marque */}
          <div className="mt-8 hidden lg:block">
            <div className="flex items-center gap-4 border-t pt-6">
              <Logo compact className="h-10 w-10" />
              <div className="min-w-0">
                <p className="font-display text-sm font-bold italic">
                  REFERENCE.COM
                </p>
                <p className="text-xs text-muted-foreground">
                  Comprendre le monde, article par article.
                </p>
              </div>
            </div>
          </div>

          {/* Rappel des canaux rapides (valeurs de l'annuaire) */}
          {quickEmail || quickHours || settingsState.loading ? (
            <div className="mt-8 grid grid-cols-2 gap-px border bg-border lg:hidden">
              <div className="flex flex-col items-center gap-1.5 bg-background p-4 text-center">
                <Mail className="size-4 text-brand-blue" aria-hidden="true" />
                <p className="text-xs font-semibold">E-mail</p>
                <p className="break-all text-[11px] text-muted-foreground">
                  {quickEmail?.value ?? "Réponse sous 48 h"}
                </p>
              </div>
              <div className="flex flex-col items-center gap-1.5 bg-background p-4 text-center">
                <Clock3 className="size-4 text-brand-blue" aria-hidden="true" />
                <p className="text-xs font-semibold">Horaires</p>
                <p className="text-[11px] text-muted-foreground">
                  {quickHours?.value ?? "Lun – ven, 9 h – 18 h"}
                </p>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
