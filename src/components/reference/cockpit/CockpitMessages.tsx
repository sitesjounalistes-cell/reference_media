"use client"

/** Cockpit — Messages : courrier des lecteurs reçu via la page Contact. */

import * as React from "react"

import { ChevronDown, Inbox, Mail, MailOpen, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AdminMessageDto, AdminMessagesResponse } from "@/components/reference/types"
import {
  EmptyState,
  ErrorPanel,
  LoadingRows,
  SectionHeader,
  formatDateShort,
  useCockpitData,
} from "./cockpit-lib"

const SUBJECT_LABEL: Record<string, string> = {
  redaction: "Rédaction",
  correction: "Correction",
  partenariat: "Partenariat",
  publicite: "Publicité",
  droits: "Droits",
  autre: "Autre",
}

export function CockpitMessages({
  refreshKey,
  onMutated,
}: {
  refreshKey: number
  onMutated: () => void
}) {
  const { toast } = useToast()
  const { data, error, loading, retry } = useCockpitData<AdminMessagesResponse>(
    "/api/admin/messages",
    refreshKey
  )
  const [filter, setFilter] = React.useState<"all" | "unread">("all")
  const [expanded, setExpanded] = React.useState<string | null>(null)
  const [toDelete, setToDelete] = React.useState<AdminMessageDto | null>(null)

  const messages = data?.messages ?? []
  const unread = messages.filter((message) => !message.read).length
  const filtered = filter === "unread" ? messages.filter((message) => !message.read) : messages

  const setRead = async (message: AdminMessageDto, read: boolean) => {
    try {
      await fetch(`/api/admin/messages/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read }),
      })
      onMutated()
    } catch {
      toast({
        title: "Action impossible",
        description: "Le message n'a pas pu être mis à jour.",
        variant: "destructive",
      })
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      const res = await fetch(`/api/admin/messages/${toDelete.id}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? "Suppression impossible")
      }
      toast({ title: "Message supprimé", description: `De ${toDelete.name}` })
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
        kicker="Courrier"
        title="Messages des lecteurs"
        description="Tout ce qui est envoyé depuis la page Contact du site arrive ici."
      />

      <div className="mb-4">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as "all" | "unread")}>
          <TabsList className="h-10 rounded-none bg-muted/60 p-0">
            <TabsTrigger value="all" className="h-10 rounded-none px-4 text-xs">
              Tous
              <span className="ml-1.5 tabular-nums text-muted-foreground">{messages.length}</span>
            </TabsTrigger>
            <TabsTrigger value="unread" className="h-10 rounded-none px-4 text-xs">
              Non lus
              {unread > 0 ? (
                <span className="ml-1.5 inline-flex min-w-5 items-center justify-center bg-brand-red px-1 tabular-nums text-white">
                  {unread}
                </span>
              ) : (
                <span className="ml-1.5 tabular-nums text-muted-foreground">0</span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {error ? (
        <ErrorPanel message={error} onRetry={retry} />
      ) : loading && !data ? (
        <div className="border p-4">
          <LoadingRows rows={5} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={filter === "unread" ? "Aucun message non lu" : "Aucun message pour l'instant"}
          hint={
            filter === "all"
              ? "Les messages envoyés via la page Contact apparaîtront ici."
              : "Vous êtes à jour — bravo !"
          }
        />
      ) : (
        <ul className="divide-y border">
          {filtered.map((message) => {
            const isOpen = expanded === message.id
            return (
              <li key={message.id} className={cn(!message.read && "bg-brand-red/[0.03]")}>
                <div className="flex items-start gap-3 px-4 py-3 sm:px-5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-1.5 size-2 shrink-0",
                      message.read ? "bg-border" : "bg-brand-red"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : message.id)}
                    className="min-w-0 flex-1 text-left outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={cn("text-sm", message.read ? "font-medium" : "font-bold")}>
                        {message.name}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">{message.email}</span>
                      <span className="border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                        {SUBJECT_LABEL[message.subject] ?? message.subject}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "mt-1 block text-[13px] leading-relaxed text-muted-foreground",
                        !isOpen && "line-clamp-2"
                      )}
                    >
                      {message.message}
                    </span>
                    <span className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/70">
                      {formatDateShort(message.createdAt)}
                      <ChevronDown
                        className={cn("size-3 transition-transform", isOpen && "rotate-180")}
                        aria-hidden="true"
                      />
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={`mailto:${message.email}?subject=RE: ${encodeURIComponent(message.subject)}`}
                      className="inline-flex size-8 items-center justify-center border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                      aria-label={`Répondre à ${message.name}`}
                      title="Répondre par email"
                    >
                      <Mail className="size-3.5" aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      onClick={() => void setRead(message, !message.read)}
                      className="inline-flex size-8 items-center justify-center border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                      aria-label={message.read ? `Marquer non lu` : `Marquer comme lu`}
                      title={message.read ? "Marquer non lu" : "Marquer comme lu"}
                    >
                      <MailOpen className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(message)}
                      className="inline-flex size-8 items-center justify-center border text-muted-foreground transition-colors hover:border-brand-red hover:text-brand-red"
                      aria-label={`Supprimer le message de ${message.name}`}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Supprimer ce message ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le message de {toDelete?.name} ({toDelete?.email}) sera définitivement supprimé.
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
