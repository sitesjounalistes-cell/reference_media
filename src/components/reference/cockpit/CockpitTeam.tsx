"use client"

/**
 * Cockpit — Équipe éditoriale : les visages de la rédaction affichés sur la
 * page « À propos ». Création, édition (nom, fonction, biographie, photo),
 * réordonnancement, visibilité et suppression.
 */

import * as React from "react"

import { ArrowDown, ArrowUp, ImagePlus, Plus, SquarePen, Trash2, Users } from "lucide-react"

import { fetchJson, useFetch } from "@/components/reference/lib"
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
import { MediaPickerDialog } from "@/components/reference/cockpit/CockpitEditor"
import type { TeamMemberDto } from "@/components/reference/types"
import { Card, EmptyState, ErrorPanel, LoadingRows, SectionHeader } from "./cockpit-lib"

/** Initiales d'un nom : 1re lettre des 2 premiers mots, sans accents. */
function initialsOf(name: string): string {
  const letters = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
  return letters || "?"
}

/* --------------------------------- dialogue -------------------------------- */

function MemberDialog({
  open,
  onOpenChange,
  member,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: TeamMemberDto | null
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [name, setName] = React.useState("")
  const [role, setRole] = React.useState("")
  const [bio, setBio] = React.useState("")
  const [photoUrl, setPhotoUrl] = React.useState("")
  const [pickPhoto, setPickPhoto] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setName(member?.name ?? "")
      setRole(member?.role ?? "")
      setBio(member?.bio ?? "")
      setPhotoUrl(member?.photoUrl ?? "")
    }
  }, [open, member])

  const save = async () => {
    setSaving(true)
    try {
      const body = JSON.stringify({
        name: name.trim(),
        role: role.trim(),
        bio: bio.trim(),
        photoUrl: photoUrl.trim() || null,
      })
      if (member) {
        await fetchJson(`/api/admin/team/${member.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body,
        })
      } else {
        await fetchJson("/api/admin/team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        })
      }
      toast({
        title: member ? "Membre modifié" : "Membre ajouté",
        description: name.trim(),
      })
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

  const valid = name.trim().length >= 2 && role.trim().length >= 2 && bio.trim().length >= 10

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {member ? "Modifier le membre" : "Nouveau membre"}
            </DialogTitle>
            <DialogDescription>
              Le membre apparaît dans la section « L&apos;équipe éditoriale » de la page À propos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="member-name">Nom</Label>
              <Input
                id="member-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Prénom Nom"
                className="rounded-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-role">Fonction</Label>
              <Input
                id="member-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Rédactrice en chef, Reporter…"
                className="rounded-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-bio">Biographie</Label>
              <Textarea
                id="member-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Quelques lignes sur le parcours et la spécialité du membre."
                rows={4}
                className="rounded-none"
              />
              <p className="text-xs text-muted-foreground/80">
                {bio.trim().length}/600 caractères
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Photo (facultative)</Label>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-14 shrink-0 items-center justify-center overflow-hidden bg-brand-blue text-sm font-bold text-white"
                >
                  {photoUrl ? (
                     
                    <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initialsOf(name.trim() || "?")
                  )}
                </span>
                <div className="flex flex-1 flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 gap-2 rounded-none"
                    onClick={() => setPickPhoto(true)}
                  >
                    <ImagePlus className="size-4" aria-hidden="true" />
                    Choisir dans la médiathèque
                  </Button>
                  {photoUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 rounded-none text-muted-foreground"
                      onClick={() => setPhotoUrl("")}
                    >
                      Retirer
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-muted-foreground/80">
                Sans photo, les initiales du membre sont affichées.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-none" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={() => void save()} disabled={!valid || saving} className="gap-2">
              {saving ? "Enregistrement…" : member ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaPickerDialog
        open={pickPhoto}
        onOpenChange={setPickPhoto}
        kind="IMAGE"
        onPick={(asset) => setPhotoUrl(asset.url)}
      />
    </>
  )
}

/* --------------------------------- section --------------------------------- */

export function CockpitTeam({
  refreshKey,
  onMutated,
}: {
  refreshKey: number
  onMutated: () => void
}) {
  const { toast } = useToast()
  const state = useFetch<{ members: TeamMemberDto[] }>(
    `/api/admin/team?_r=${refreshKey}`
  )
  const members = state.data?.members ?? []

  const [dialog, setDialog] = React.useState<{ open: boolean; member: TeamMemberDto | null }>({
    open: false,
    member: null,
  })
  const [toDelete, setToDelete] = React.useState<TeamMemberDto | null>(null)

  const patch = async (member: TeamMemberDto, changes: Partial<TeamMemberDto>) => {
    try {
      await fetchJson(`/api/admin/team/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      })
      onMutated()
    } catch (err) {
      toast({
        title: "Modification impossible",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  const move = async (member: TeamMemberDto, direction: -1 | 1) => {
    const index = members.findIndex((row) => row.id === member.id)
    const neighbor = members[index + direction]
    if (!neighbor) return
    // Échange des ordres : l'API renvoie les lignes à jour au rechargement.
    await Promise.all([
      patch(member, { order: neighbor.order }),
      patch(neighbor, { order: member.order }),
    ])
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      const res = await fetch(`/api/admin/team/${toDelete.id}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? "Suppression impossible")
      }
      toast({ title: "Membre supprimé", description: toDelete.name })
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

  return (
    <div>
      <SectionHeader
        kicker="Rédaction"
        title="Équipe éditoriale"
        description="Les visages affichés sur la page « À propos » : ajoutez vos journalistes, leurs fonctions, leurs biographies et leurs photos."
      />

      <Card title={`Membres (${members.length})`}>
        {state.error ? (
          <ErrorPanel message={state.error} onRetry={state.retry} />
        ) : state.loading ? (
          <LoadingRows rows={4} />
        ) : (
          <>
            <ul className="divide-y">
              {members.map((member, index) => (
                <li key={member.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center overflow-hidden bg-brand-blue text-xs font-bold text-white"
                  >
                    {member.photoUrl ? (
                       
                      <img src={member.photoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initialsOf(member.name)
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {member.name}
                      {!member.visible ? (
                        <span className="ml-2 border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                          masqué
                        </span>
                      ) : null}
                    </span>
                    <span className="block truncate text-[11px] uppercase tracking-[0.08em] text-brand-blue">
                      {member.role}
                    </span>
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`Monter ${member.name}`}
                      disabled={index === 0}
                      onClick={() => void move(member, -1)}
                    >
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`Descendre ${member.name}`}
                      disabled={index === members.length - 1}
                      onClick={() => void move(member, 1)}
                    >
                      <ArrowDown className="size-4" aria-hidden="true" />
                    </Button>
                    <Switch
                      checked={member.visible}
                      onCheckedChange={(checked) => void patch(member, { visible: checked })}
                      aria-label={member.visible ? `Masquer ${member.name}` : `Afficher ${member.name}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`Modifier ${member.name}`}
                      onClick={() => setDialog({ open: true, member })}
                    >
                      <SquarePen className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 hover:text-brand-red"
                      aria-label={`Supprimer ${member.name}`}
                      onClick={() => setToDelete(member)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            {members.length === 0 ? (
              <div className="mb-3">
                <EmptyState
                  icon={Users}
                  title="Aucun membre"
                  hint="Ajoutez les journalistes de la rédaction pour les afficher sur la page À propos."
                />
              </div>
            ) : null}
            <Button
              variant="outline"
              className="mt-3 w-full gap-2 rounded-none"
              onClick={() => setDialog({ open: true, member: null })}
            >
              <Plus className="size-4" aria-hidden="true" />
              Nouveau membre
            </Button>
          </>
        )}
      </Card>

      <MemberDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        member={dialog.member}
        onSaved={onMutated}
      />

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">
              Supprimer ce membre ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete
                ? `« ${toDelete.name} » disparaîtra de la page À propos. Cette action est définitive.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="gap-2 rounded-none bg-brand-red text-white hover:bg-brand-red/90"
              onClick={() => void confirmDelete()}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
