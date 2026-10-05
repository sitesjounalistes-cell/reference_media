"use client"

/**
 * Cockpit — Paramètres du site : informations générales, annuaire de contact
 * (téléphones, emails, adresse, horaires) et réseaux sociaux.
 */

import * as React from "react"

import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Save, Trash2 } from "lucide-react"

import { channelHref, getChannelIcon, getSocialIcon } from "@/components/reference/lib"
import { fetchJson } from "@/components/reference/lib"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type {
  ContactChannelDto,
  SiteSettingsResponse,
  SocialLinkDto,
} from "@/components/reference/types"
import { Card, ErrorPanel, SectionHeader, Spinner, useCockpitData } from "./cockpit-lib"

/* --------------------------- infos générales ------------------------------- */

const SETTING_FIELDS: Array<{
  key: string
  label: string
  hint: string
  textarea?: boolean
}> = [
  { key: "siteName", label: "Nom du site", hint: "Utilisé dans le pied de page et les mentions." },
  { key: "tagline", label: "Accroche", hint: "Affichée dans la barre d'édition du haut de page." },
  { key: "footerNote", label: "Mention de pied de page", hint: "Ligne de droits et signature." },
  {
    key: "aboutLead",
    label: "Chapô « À propos »",
    hint: "Texte d'introduction de la page À propos.",
    textarea: true,
  },
]

function GeneralCard({ refreshKey }: { refreshKey: number }) {
  const { toast } = useToast()
  const { data, error, loading, retry } = useCockpitData<{
    settings: Record<string, string>
  }>("/api/admin/settings", refreshKey)
  const [values, setValues] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (data?.settings) setValues({ ...data.settings })
  }, [data])

  const baseline = data?.settings
  const dirty = baseline
    ? SETTING_FIELDS.some((field) => (values[field.key] ?? "") !== (baseline[field.key] ?? ""))
    : false

  const save = async () => {
    setSaving(true)
    try {
      await fetchJson("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      toast({
        title: "Paramètres enregistrés",
        description: "Les changements sont visibles immédiatement sur le site.",
      })
    } catch (err) {
      toast({
        title: "Enregistrement impossible",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (error) return <ErrorPanel message={error} onRetry={retry} />

  return (
    <Card title="Informations générales">
      {loading && !data ? (
        <div className="space-y-3" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="block h-10 w-full animate-pulse bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {SETTING_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label htmlFor={`setting-${field.key}`} className="kicker block text-muted-foreground">
                {field.label}
              </label>
              {field.textarea ? (
                <Textarea
                  id={`setting-${field.key}`}
                  value={values[field.key] ?? ""}
                  onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
                  rows={2}
                  className="rounded-none"
                />
              ) : (
                <Input
                  id={`setting-${field.key}`}
                  value={values[field.key] ?? ""}
                  onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
                  className="h-10 rounded-none"
                />
              )}
              <p className="text-xs text-muted-foreground/80">{field.hint}</p>
            </div>
          ))}
          <div className="flex justify-end">
            <Button onClick={() => void save()} disabled={!dirty || saving} className="min-h-10 gap-2">
              {saving ? <Spinner className="text-primary-foreground" /> : <Save className="size-4" aria-hidden="true" />}
              Enregistrer
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

/* ----------------------------- annuaire de contact ------------------------- */

const CHANNEL_TYPES = [
  { value: "PHONE", label: "Téléphone" },
  { value: "EMAIL", label: "Email" },
  { value: "ADDRESS", label: "Adresse" },
  { value: "HOURS", label: "Horaires" },
] as const

function ChannelsCard({ refreshKey, onMutated }: { refreshKey: number; onMutated: () => void }) {
  const { toast } = useToast()
  const { data, error, loading, retry } = useCockpitData<{ channels: ContactChannelDto[] }>(
    "/api/admin/channels",
    refreshKey
  )
  const [channels, setChannels] = React.useState<ContactChannelDto[]>([])

  React.useEffect(() => {
    if (data) setChannels(data.channels)
  }, [data])

  const patch = async (channel: ContactChannelDto, changes: Partial<ContactChannelDto>) => {
    try {
      const updated = await fetchJson<{ channel: ContactChannelDto }>(
        `/api/admin/channels/${channel.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changes),
        }
      )
      setChannels((rows) => rows.map((row) => (row.id === updated.channel.id ? updated.channel : row)))
      onMutated()
    } catch (err) {
      toast({
        title: "Modification impossible",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  const move = async (channel: ContactChannelDto, direction: -1 | 1) => {
    const index = channels.findIndex((row) => row.id === channel.id)
    const neighbor = channels[index + direction]
    if (!neighbor) return
    // Échange des ordres puis re-render local (l'API renvoie les lignes à jour).
    await Promise.all([
      patch(channel, { order: neighbor.order }),
      patch(neighbor, { order: channel.order }),
    ])
    setChannels((rows) => {
      const next = [...rows]
      const a = next[index]
      next[index] = next[index + direction]
      next[index + direction] = a
      return next
    })
  }

  const add = async () => {
    try {
      await fetchJson("/api/admin/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "PHONE", label: "Nouveau canal", value: "" }),
      })
      onMutated()
    } catch (err) {
      toast({
        title: "Ajout impossible",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  const remove = async (channel: ContactChannelDto) => {
    try {
      const res = await fetch(`/api/admin/channels/${channel.id}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) throw new Error("Suppression impossible")
      setChannels((rows) => rows.filter((row) => row.id !== channel.id))
      onMutated()
    } catch (err) {
      toast({
        title: "Suppression impossible",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  if (error) return <ErrorPanel message={error} onRetry={retry} />

  return (
    <Card
      title="Annuaire de contact"
      description="Téléphones, emails, adresse et horaires — affichés sur la page Contact et dans le pied de page."
    >
      {loading && channels.length === 0 ? (
        <div className="space-y-2" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className="block h-12 w-full animate-pulse bg-muted" />
          ))}
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {channels.map((channel, index) => {
              const Icon = getChannelIcon(channel.type)
              const href = channelHref(channel.type, channel.value)
              return (
                <li key={channel.id} className="flex flex-wrap items-center gap-2 border p-2">
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <Select
                    value={channel.type}
                    onValueChange={(value) =>
                      void patch(channel, {
                        type: value as (typeof CHANNEL_TYPES)[number]["value"],
                      })
                    }
                  >
                    <SelectTrigger className="h-9 w-[130px] shrink-0 rounded-none" aria-label="Type de canal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {CHANNEL_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    defaultValue={channel.label}
                    onBlur={(event) => {
                      if (event.target.value !== channel.label) {
                        void patch(channel, { label: event.target.value })
                      }
                    }}
                    className="h-9 w-32 shrink-0 rounded-none"
                    aria-label="Libellé"
                    placeholder="Libellé"
                  />
                  <Input
                    defaultValue={channel.value}
                    onBlur={(event) => {
                      if (event.target.value !== channel.value) {
                        void patch(channel, { value: event.target.value })
                      }
                    }}
                    className="h-9 min-w-0 flex-1 rounded-none font-mono text-xs"
                    aria-label="Valeur"
                    placeholder="Valeur"
                  />
                  <div className="ml-auto flex shrink-0 items-center gap-1">
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"
                        aria-label="Tester le lien"
                        title="Tester le lien"
                      >
                        <Eye className="size-3.5" aria-hidden="true" />
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void move(channel, -1)}
                      disabled={index === 0}
                      className="inline-flex size-8 items-center justify-center text-muted-foreground outline-none transition-colors hover:text-foreground disabled:opacity-30"
                      aria-label="Monter"
                    >
                      <ArrowUp className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void move(channel, 1)}
                      disabled={index === channels.length - 1}
                      className="inline-flex size-8 items-center justify-center text-muted-foreground outline-none transition-colors hover:text-foreground disabled:opacity-30"
                      aria-label="Descendre"
                    >
                      <ArrowDown className="size-3.5" aria-hidden="true" />
                    </button>
                    <Switch
                      checked={channel.visible}
                      onCheckedChange={(checked) => void patch(channel, { visible: checked })}
                      aria-label={channel.visible ? "Visible sur le site" : "Masqué du site"}
                    />
                    <button
                      type="button"
                      onClick={() => void remove(channel)}
                      className="inline-flex size-8 items-center justify-center text-muted-foreground outline-none transition-colors hover:text-brand-red"
                      aria-label={`Supprimer ${channel.label}`}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
          <Button variant="outline" className="mt-3 w-full gap-2 rounded-none" onClick={() => void add()}>
            <Plus className="size-4" aria-hidden="true" />
            Ajouter un canal
          </Button>
        </>
      )}
    </Card>
  )
}

/* ------------------------------ réseaux sociaux ---------------------------- */

const SOCIAL_PLATFORMS = [
  { value: "x", label: "X (Twitter)" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" },
  { value: "rss", label: "Flux RSS" },
] as const

function SocialsCard({ refreshKey, onMutated }: { refreshKey: number; onMutated: () => void }) {
  const { toast } = useToast()
  const { data, error, loading, retry } = useCockpitData<{ socials: SocialLinkDto[] }>(
    "/api/admin/socials",
    refreshKey
  )
  const [socials, setSocials] = React.useState<SocialLinkDto[]>([])

  React.useEffect(() => {
    if (data) setSocials(data.socials)
  }, [data])

  const patch = async (social: SocialLinkDto, changes: Partial<SocialLinkDto>) => {
    try {
      const updated = await fetchJson<{ social: SocialLinkDto }>(
        `/api/admin/socials/${social.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changes),
        }
      )
      setSocials((rows) => rows.map((row) => (row.id === updated.social.id ? updated.social : row)))
      onMutated()
    } catch (err) {
      toast({
        title: "Modification impossible",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  const move = async (social: SocialLinkDto, direction: -1 | 1) => {
    const index = socials.findIndex((row) => row.id === social.id)
    const neighbor = socials[index + direction]
    if (!neighbor) return
    await Promise.all([
      patch(social, { order: neighbor.order }),
      patch(neighbor, { order: social.order }),
    ])
    setSocials((rows) => {
      const next = [...rows]
      const a = next[index]
      next[index] = next[index + direction]
      next[index + direction] = a
      return next
    })
  }

  const add = async () => {
    try {
      await fetchJson("/api/admin/socials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "x", url: "https://" }),
      })
      onMutated()
    } catch (err) {
      toast({
        title: "Ajout impossible",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  const remove = async (social: SocialLinkDto) => {
    try {
      const res = await fetch(`/api/admin/socials/${social.id}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) throw new Error("Suppression impossible")
      setSocials((rows) => rows.filter((row) => row.id !== social.id))
      onMutated()
    } catch (err) {
      toast({
        title: "Suppression impossible",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  if (error) return <ErrorPanel message={error} onRetry={retry} />

  return (
    <Card
      title="Réseaux sociaux"
      description="Les liens affichés dans le pied de page du site — ajoutez, retirez, réordonnez."
    >
      {loading && socials.length === 0 ? (
        <div className="space-y-2" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className="block h-12 w-full animate-pulse bg-muted" />
          ))}
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {socials.map((social, index) => {
              const Icon = getSocialIcon(social.platform)
              return (
                <li key={social.id} className="flex flex-wrap items-center gap-2 border p-2">
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <Select
                    value={social.platform}
                    onValueChange={(value) => void patch(social, { platform: value })}
                  >
                    <SelectTrigger className="h-9 w-[150px] shrink-0 rounded-none" aria-label="Plateforme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {SOCIAL_PLATFORMS.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    defaultValue={social.url}
                    onBlur={(event) => {
                      if (event.target.value !== social.url) {
                        void patch(social, { url: event.target.value })
                      }
                    }}
                    className="h-9 min-w-0 flex-1 rounded-none font-mono text-xs"
                    aria-label="URL du réseau"
                    placeholder="https://…"
                  />
                  <div className="ml-auto flex shrink-0 items-center gap-1">
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label="Ouvrir le lien"
                      title="Ouvrir le lien"
                    >
                      <Eye className="size-3.5" aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      onClick={() => void move(social, -1)}
                      disabled={index === 0}
                      className="inline-flex size-8 items-center justify-center text-muted-foreground outline-none transition-colors hover:text-foreground disabled:opacity-30"
                      aria-label="Monter"
                    >
                      <ArrowUp className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void move(social, 1)}
                      disabled={index === socials.length - 1}
                      className="inline-flex size-8 items-center justify-center text-muted-foreground outline-none transition-colors hover:text-foreground disabled:opacity-30"
                      aria-label="Descendre"
                    >
                      <ArrowDown className="size-3.5" aria-hidden="true" />
                    </button>
                    <Switch
                      checked={social.visible}
                      onCheckedChange={(checked) => void patch(social, { visible: checked })}
                      aria-label={social.visible ? "Visible sur le site" : "Masqué du site"}
                    />
                    <button
                      type="button"
                      onClick={() => void remove(social)}
                      className="inline-flex size-8 items-center justify-center text-muted-foreground outline-none transition-colors hover:text-brand-red"
                      aria-label={`Supprimer ${social.platform}`}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
          <Button variant="outline" className="mt-3 w-full gap-2 rounded-none" onClick={() => void add()}>
            <Plus className="size-4" aria-hidden="true" />
            Ajouter un réseau
          </Button>
        </>
      )}
    </Card>
  )
}

/* ------------------------------ section complète --------------------------- */

/* ------------------------------- FM / TV ----------------------------------- */

/** Interrupteurs FM et TV + flux associés, visibles sur le site public. */
function FmTvCard({ refreshKey }: { refreshKey: number }) {
  const { toast } = useToast()
  const { data, loading, error } = useCockpitData<SiteSettingsResponse>(
    "/api/admin/settings",
    refreshKey
  )
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    fmEnabled: false,
    fmLabel: "",
    fmStreamUrl: "",
    tvEnabled: false,
    tvLabel: "",
    tvStreamUrl: "",
  })

  React.useEffect(() => {
    if (!data) return
    setForm({
      fmEnabled: data.settings.fmEnabled === "true",
      fmLabel: data.settings.fmLabel ?? "",
      fmStreamUrl: data.settings.fmStreamUrl ?? "",
      tvEnabled: data.settings.tvEnabled === "true",
      tvLabel: data.settings.tvLabel ?? "",
      tvStreamUrl: data.settings.tvStreamUrl ?? "",
    })
  }, [data])

  const save = async () => {
    setSaving(true)
    try {
      await fetchJson("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fmEnabled: String(form.fmEnabled),
          fmLabel: form.fmLabel.trim(),
          fmStreamUrl: form.fmStreamUrl.trim(),
          tvEnabled: String(form.tvEnabled),
          tvLabel: form.tvLabel.trim(),
          tvStreamUrl: form.tvStreamUrl.trim(),
        }),
      })
      toast({ title: "FM / TV mis à jour", description: "Les changements sont visibles immédiatement sur le site." })
    } catch (err) {
      toast({
        title: "Enregistrement impossible",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "h-9 rounded-none"

  return (
    <Card
      title="FM & TV"
      description="Activez la radio et la chaîne TV : elles apparaissent en barre flottante sur le site public."
    >
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorPanel message={error} />
      ) : (
        <div className="space-y-5">
          {/* FM */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="kicker text-muted-foreground">Radio FM</span>
              <Switch
                checked={form.fmEnabled}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, fmEnabled: checked }))}
                aria-label="Activer la radio FM"
              />
            </div>
            <Input
              value={form.fmLabel}
              onChange={(e) => setForm((f) => ({ ...f, fmLabel: e.target.value }))}
              placeholder="Libellé du bouton (ex. FM Paris)"
              className={inputClass}
              aria-label="Libellé FM"
            />
            <Input
              value={form.fmStreamUrl}
              onChange={(e) => setForm((f) => ({ ...f, fmStreamUrl: e.target.value }))}
              placeholder="URL du flux audio (https://…/stream.mp3)"
              className={inputClass}
              aria-label="URL du flux FM"
            />
          </div>
          {/* TV */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="kicker text-muted-foreground">Chaîne TV</span>
              <Switch
                checked={form.tvEnabled}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, tvEnabled: checked }))}
                aria-label="Activer la chaîne TV"
              />
            </div>
            <Input
              value={form.tvLabel}
              onChange={(e) => setForm((f) => ({ ...f, tvLabel: e.target.value }))}
              placeholder="Libellé du bouton (ex. Réf TV)"
              className={inputClass}
              aria-label="Libellé TV"
            />
            <Input
              value={form.tvStreamUrl}
              onChange={(e) => setForm((f) => ({ ...f, tvStreamUrl: e.target.value }))}
              placeholder="URL du flux vidéo (https://….mp4 / .m3u8)"
              className={inputClass}
              aria-label="URL du flux TV"
            />
          </div>
          <Button onClick={() => void save()} disabled={saving} className="min-h-10 gap-2 rounded-none">
            {saving ? <Spinner className="text-primary-foreground" /> : <Save className="size-4" aria-hidden="true" />}
            Enregistrer FM / TV
          </Button>
        </div>
      )}
    </Card>
  )
}

export function CockpitSettings({
  refreshKey,
  onMutated,
}: {
  refreshKey: number
  onMutated: () => void
}) {
  return (
    <div>
      <SectionHeader
        kicker="Administration"
        title="Paramètres du site"
        description="Les informations affichées partout sur le site : identité, contacts et réseaux sociaux. Chaque modification est visible immédiatement."
      />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <GeneralCard refreshKey={refreshKey} />
          <FmTvCard refreshKey={refreshKey} />
        </div>
        <div className="space-y-6">
          <ChannelsCard refreshKey={refreshKey} onMutated={onMutated} />
          <SocialsCard refreshKey={refreshKey} onMutated={onMutated} />
        </div>
      </div>
    </div>
  )
}
