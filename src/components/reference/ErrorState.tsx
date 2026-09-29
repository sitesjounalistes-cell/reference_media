"use client"

import * as React from "react"

import { AlertTriangle, RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  message?: string
  onRetry: () => void
  className?: string
  compact?: boolean
}

/** État d'erreur réutilisable avec bouton « Réessayer ». */
export function ErrorState({
  message = "Impossible de charger le contenu. Vérifiez votre connexion puis réessayez.",
  onRetry,
  className,
  compact = false,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-4 border border-dashed border-border bg-muted/40 text-center",
        compact ? "p-5" : "p-8 md:p-12",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center border-2 border-brand-red bg-background text-brand-red",
          compact ? "size-10" : "size-12"
        )}
      >
        <AlertTriangle className={compact ? "size-4" : "size-5"} />
      </span>
      <p className="max-w-sm text-sm leading-relaxed text-zinc-600">{message}</p>
      <Button
        variant="outline"
        size={compact ? "sm" : "default"}
        onClick={onRetry}
        className="kicker min-h-11 border-2 border-[#0a1e3c] bg-background px-6 text-[#0a1e3c] hover:bg-[#0a1e3c] hover:text-white"
      >
        <RotateCw aria-hidden="true" />
        Réessayer
      </Button>
    </div>
  )
}
