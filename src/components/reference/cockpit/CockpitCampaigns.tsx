"use client"

/** Cockpit — Régie publicitaire : campagnes, emplacements, statistiques temps réel. */

import * as React from "react"

import { Megaphone, Plus, SquarePen, Trash2 } from "lucide-react"

import { formatViews } from "@/components/reference/lib"
import { cn } from "@/lib/utils"
import { MediaPickerDialog } from "@/components/reference/cockpit/CockpitEditor"
import { fetchJson } from "@/components/reference/lib"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type {
  AdSlotName,
  AdminCampaignDto,
  AdminCampaignInput,
  AdminCampaignsResponse,
} from "@/components/reference/types"
import {
  Card,
  EmptyState,
  ErrorPanel,
  LoadingRows,
  SectionHeader,
} from "./cockpit-lib"

const SLOT_OPTIONS: Array<{ value: AdSlotName; label: string }> = [
  { value: "top", label: "Bannière haute" },
  { value: "leaderboard", label: "Bandeau" },
  { value: "sidebar", label: "Colonne latérale" },
  { value: "rail-left", label: "Rail gauche" },
  { value: "rail-right", label: "Rail droit" },
  { value: "inline", label: "Dans les articles" },
  { value: "billboard", label: "Grand format" },
  { value: "bottom", label: "Bas de page" },
]

function CampaignDialog({
  campaign,
  open,
  onOpenChange,
  onSaved,
}: {
  campaign: AdminCampaignDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [form, setForm] = React.useState({
    name: "",
    advertiser: "",
    headline: "",
    body: "",
    ctaLabel: "Découvrir",
    ctaView: "home",
    imageUrl: "",
    color: "#1B5FD9",
    weight: "1",
    active: true,
    slots: new Set<AdSlotName>(),
  })
  const [saving, setSaving] = React.useState(false)
  const [pickImage, setPickImage] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setForm({
        name: campaign?.name ?? "",
        advertiser: campaign?.advertiser ?? "",
        headline: campaign?.headline ?? "",
        body: campaign?.body ?? "",
        ctaLabel: campaign?.ctaLabel ?? "Découvrir",
        ctaView: campaign?.ctaView ?? "home",
        imageUrl: campaign?.imageUrl ?? "",
        color: campaign?.color ?? "#1B5FD9",
        weight: String(campaign?.weight ?? 1),
        active: campaign?.active ?? true,
        slots: new Set(campaign?.slots ?? []),
      })
    }
  }, [open, campaign])

  const toggleSlot = (slot: AdSlotName) =>
    setForm((current) => {
      const slots = new Set(current.slots)
      if (slots.has(slot)) slots.delete(slot)
      else slots.add(slot)
      return { ...current, slots }
    })

  const save = async () => {
    setSaving(true)
    const payload: AdminCampaignInput = {
      name: form.name.trim(),
      advertiser: form.advertiser.trim(),
      headline: form.headline.trim(),
      body: form.body.trim(),
      ctaLabel: form.ctaLabel.trim(),
      ctaView: form.ctaView.trim() || "home",
      imageUrl: form.imageUrl.trim() || null,
      color: form.color,
      slots: Array.from(form.slots),
      active: form.active,
      weight: Math.min(Math.max(Number.parseInt(form.weight, 10) || 1, 1), 10),
    }
    try {
      if (campaign) {
        await fetchJson(`/api/admin/campaigns/${campaign.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        await fetchJson("/api/admin/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }
      toast({ title: campaign ? "Campagne modifiée" : "Campagne créée", description: payload.name })
      onOpenChange(false)
      onSaved()
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

  const valid =
    form.name.trim().length >= 2 &&
    form.advertiser.trim().length >= 2 &&
    form.headline.trim().length >= 2 &&
    form.body.trim().length >= 2 &&
    form.slots.size > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-none nice-scrollbar">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {campaign ? "Modifier la campagne" : "Nouvelle campagne"}
          </DialogTitle>
          <DialogDescription>
            La créa est composée de texte : annonceur, titre, corps et bouton d'action.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="camp-name">Nom interne</Label>
              <Input
                id="camp-name"
                value={form.name}
                onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                className="rounded-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="camp-advertiser">Annonceur (affiché)</Label>
              <Input
                id="camp-advertiser"
                value={form.advertiser}
                onChange={(e) => setForm((c) => ({ ...c, advertiser: e.target.value }))}
                className="rounded-none"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="camp-headline">Titre de la créa</Label>
            <Input
              id="camp-headline"
              value={form.headline}
              onChange={(e) => setForm((c) => ({ ...c, headline: e.target.value }))}
              className="rounded-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="camp-body">Texte</Label>
            <Textarea
              id="camp-body"
              value={form.body}
              onChange={(e) => setForm((c) => ({ ...c, body: e.target.value }))}
              rows={2}
              className="rounded-none"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="camp-cta">Bouton</Label>
              <Input
                id="camp-cta"
                value={form.ctaLabel}
                onChange={(e) => setForm((c) => ({ ...c, ctaLabel: e.target.value }))}
                className="rounded-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="camp-ctaview">Destination (lien)</Label>
              <Input
                id="camp-ctaview"
                value={form.ctaView}
                onChange={(e) => setForm((c) => ({ ...c, ctaView: e.target.value }))}
                placeholder="https://votre-site.com/page — ou interne : home · about · contact:publicite · category:sciences"
                className="rounded-none font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Collez un lien https : le clic sur l'annonce ouvrira cette page.
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="camp-image">Image de la créa</Label>
            <div className="flex gap-2">
              <Input
                id="camp-image"
                value={form.imageUrl}
                onChange={(e) => setForm((c) => ({ ...c, imageUrl: e.target.value }))}
                placeholder="Visuel de l'annonce (bouton ci-contre pour choisir dans la médiathèque)"
                className="rounded-none font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                className="h-9 shrink-0 rounded-none"
                onClick={() => setPickImage(true)}
              >
                Choisir…
              </Button>
            </div>
            {form.imageUrl ? (
               
              <img
                src={form.imageUrl}
                alt="Aperçu de la créa"
                className="mt-2 max-h-28 border object-contain"
              />
            ) : null}
            <ImagePicker open={pickImage} onOpenChange={setPickImage} onPick={(url) => setForm((cf) => ({ ...cf, imageUrl: url }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="camp-color">Couleur</Label>
              <div className="flex gap-1.5">
                <input
                  id="camp-color"
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((c) => ({ ...c, color: e.target.value }))}
                  className="h-9 w-9 cursor-pointer border p-0.5"
                  aria-label="Couleur de la campagne"
                />
                <Input
                  value={form.color}
                  onChange={(e) => setForm((c) => ({ ...c, color: e.target.value }))}
                  className="h-9 rounded-none font-mono text-xs"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="camp-weight">Poids (1-10)</Label>
              <Input
                id="camp-weight"
                type="number"
                min={1}
                max={10}
                value={form.weight}
                onChange={(e) => setForm((c) => ({ ...c, weight: e.target.value }))}
                className="h-9 rounded-none"
              />
            </div>
            <label className="flex items-center justify-between gap-3 pt-5">
              <span className="text-sm">Active</span>
              <Switch
                checked={form.active}
                onCheckedChange={(checked) => setForm((c) => ({ ...c, active: checked }))}
              />
            </label>
          </div>
          <div className="space-y-1.5">
            <Label>Emplacements ({form.slots.size} sélectionné{form.slots.size > 1 ? "s" : ""})</Label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {SLOT_OPTIONS.map((option) => {
                const active = form.slots.has(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleSlot(option.value)}
                    aria-pressed={active}
                    className={cn(
                      "border px-2 py-2 text-[11px] font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-none" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button className="rounded-none" disabled={!valid || saving} onClick={() => void save()}>
            {campaign ? "Enregistrer" : "Créer la campagne"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
function CampaignImagePicker({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; onPick: (url: string) => void }) {
  return <MediaPickerDialog open={open} onOpenChange={onOpenChange} kind="IMAGE" onPick={(asset) => onPick(asset.url)} />
}

function ImagePicker({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; onPick: (url: string) => void }) {
  return <MediaPickerDialog open={open} onOpenChange={onOpenChange} kind="IMAGE" onPick={(a) => onPick(a.url)} />
}

export function CockpitCampaigns({ refreshKey, onMutated }: { refreshKey: number; onMutated: () => void }) {
  const { toast } = useToast()
  const [campaigns, setCampaigns] = React.useState<AdminCampaignDto[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [dialog, setDialog] = React.useState<{ open: boolean; campaign: AdminCampaignDto | null }>({
    open: false,
    campaign: null,
  })
  const [toDelete, setToDelete] = React.useState<AdminCampaignDto | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchJson<AdminCampaignsResponse>(`/api/admin/campaigns?_r=${refreshKey}`)
      setCampaigns(data.campaigns)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les campagnes")
    } finally {
      setLoading(false)
    }
  }, [refreshKey])

  React.useEffect(() => {
    void load()
  }, [load])

  const toggleActive = async (campaign: AdminCampaignDto, active: boolean) => {
    try {
      const updated = await fetchJson<{ campaign: AdminCampaignDto }>(
        `/api/admin/campaigns/${campaign.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active }),
        }
      )
      setCampaigns((rows) =>
        rows?.map((row) => (row.id === updated.campaign.id ? updated.campaign : row)) ?? rows
      )
      toast({
        title: active ? "Campagne activée" : "Campagne mise en pause",
        description: campaign.name,
      })
      onMutated()
    } catch (err) {
      toast({
        title: "Action impossible",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      const res = await fetch(`/api/admin/campaigns/${toDelete.id}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? "Suppression impossible")
      }
      setCampaigns((rows) => rows?.filter((row) => row.id !== toDelete.id) ?? rows)
      toast({ title: "Campagne supprimée", description: toDelete.name })
      onMutated()
    } catch (err) {
      toast({
        title: "Suppression impossible",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setToDelete(null)
    }
  }

  const totals = React.useMemo(() => {
    const rows = campaigns ?? []
    const impressions = rows.reduce((sum, row) => sum + row.impressions, 0)
    const clicks = rows.reduce((sum, row) => sum + row.clicks, 0)
    return {
      impressions,
      clicks,
      ctr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2).replace(".", ",") : "0",
      active: rows.filter((row) => row.active).length,
    }
  }, [campaigns])

  return (
    <div>
      <SectionHeader
        kicker="Régie"
        title="Campagnes publicitaires"
        description="Créez et pilotez les campagnes affichées dans tous les emplacements du site : bannière haute, rails latéraux, articles, bas de page…"
      >
        <Button
          onClick={() => setDialog({ open: true, campaign: null })}
          className="min-h-10 gap-2"
        >
          <Plus className="size-4" aria-hidden="true" />
          Nouvelle campagne
        </Button>
      </SectionHeader>

      <div className="mb-4 grid grid-cols-2 gap-px border bg-border sm:grid-cols-4">
        <Card>
          <p className="kicker text-muted-foreground">Impressions</p>
          <p className="mt-1 font-serif text-xl font-bold tabular-nums">{formatViews(totals.impressions)}</p>
        </Card>
        <Card>
          <p className="kicker text-muted-foreground">Clics</p>
          <p className="mt-1 font-serif text-xl font-bold tabular-nums">{formatViews(totals.clicks)}</p>
        </Card>
        <Card>
          <p className="kicker text-muted-foreground">CTR moyen</p>
          <p className="mt-1 font-serif text-xl font-bold tabular-nums">{totals.ctr} %</p>
        </Card>
        <Card>
          <p className="kicker text-muted-foreground">Actives</p>
          <p className="mt-1 font-serif text-xl font-bold tabular-nums">
            {totals.active}/{campaigns?.length ?? 0}
          </p>
        </Card>
      </div>

      {error ? (
        <ErrorPanel message={error} onRetry={load} />
      ) : loading && !campaigns ? (
        <div className="border p-4">
          <LoadingRows rows={4} />
        </div>
      ) : campaigns && campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Aucune campagne"
          hint="Créez votre première campagne : elle apparaîtra dans les emplacements choisis."
        />
      ) : (
        <div className="border">
          <div className="max-h-[62vh] overflow-y-auto nice-scrollbar">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted/70 backdrop-blur-sm">
                <tr className="text-left">
                  <th className="kicker px-4 py-3 font-bold text-muted-foreground">Campagne</th>
                  <th className="kicker hidden px-3 py-3 font-bold text-muted-foreground md:table-cell">Emplacements</th>
                  <th className="kicker px-3 py-3 text-center font-bold text-muted-foreground">Active</th>
                  <th className="kicker hidden px-3 py-3 text-right font-bold text-muted-foreground sm:table-cell">Impr.</th>
                  <th className="kicker hidden px-3 py-3 text-right font-bold text-muted-foreground sm:table-cell">Clics</th>
                  <th className="kicker hidden px-3 py-3 text-right font-bold text-muted-foreground lg:table-cell">CTR</th>
                  <th className="px-3 py-3" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {(campaigns ?? []).map((campaign) => (
                  <tr key={campaign.id} className="transition-colors hover:bg-muted/40">
                    <td className="max-w-[260px] px-4 py-3">
                      <p className="flex items-center gap-2 truncate font-serif font-semibold">
                        <span aria-hidden="true" className="size-3 shrink-0" style={{ backgroundColor: campaign.color }} />
                        {campaign.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {campaign.advertiser} — {campaign.headline}
                      </p>
                    </td>
                    <td className="hidden max-w-[220px] px-3 py-3 md:table-cell">
                      <span className="flex flex-wrap gap-1">
                        {campaign.slots.map((slot) => (
                          <span
                            key={slot}
                            className="border px-1 py-0.5 font-mono text-[10px] text-muted-foreground"
                          >
                            {slot}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Switch
                        checked={campaign.active}
                        onCheckedChange={(checked) => void toggleActive(campaign, checked)}
                        aria-label={`Campagne ${campaign.name} ${campaign.active ? "active" : "en pause"}`}
                      />
                    </td>
                    <td className="hidden px-3 py-3 text-right tabular-nums text-xs text-muted-foreground sm:table-cell">
                      {campaign.impressions.toLocaleString("fr-FR")}
                    </td>
                    <td className="hidden px-3 py-3 text-right tabular-nums text-xs text-muted-foreground sm:table-cell">
                      {campaign.clicks.toLocaleString("fr-FR")}
                    </td>
                    <td className="hidden px-3 py-3 text-right tabular-nums text-xs lg:table-cell">
                      {campaign.ctr.toFixed(2).replace(".", ",")} %
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Modifier ${campaign.name}`}
                          onClick={() => setDialog({ open: true, campaign })}
                        >
                          <SquarePen className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 hover:text-brand-red"
                          aria-label={`Supprimer ${campaign.name}`}
                          onClick={() => setToDelete(campaign)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CampaignDialog
        open={dialog.open}
        campaign={dialog.campaign}
        onOpenChange={(open) => setDialog({ open, campaign: dialog.campaign })}
        onSaved={onMutated}
      />

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Supprimer cette campagne ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {toDelete?.name} » et ses statistiques seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-none bg-brand-red text-white hover:bg-brand-red/85"
              onClick={(event) => {
                event.preventDefault()
                void confirmDelete()
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
