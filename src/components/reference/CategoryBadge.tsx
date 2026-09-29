"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { getCategoryIcon } from "@/components/reference/lib"

interface CategoryBadgeProps extends React.ComponentProps<"span"> {
  name: string
  /** Couleur hex de la catégorie (fond de la pastille, texte blanc). */
  color: string
  /** Nom d'icône lucide optionnel affiché avant le libellé. */
  icon?: string | null
  size?: "sm" | "md"
}

/** Pastille de catégorie : fond = couleur de la catégorie, texte blanc, angles droits. */
export function CategoryBadge({
  name,
  color,
  icon,
  size = "sm",
  className,
  ...props
}: CategoryBadgeProps) {
  const Icon = getCategoryIcon(icon)
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1 font-bold uppercase tracking-[0.1em] text-white",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        className
      )}
      style={{ backgroundColor: color }}
      {...props}
    >
      {icon ? <Icon className="size-3" aria-hidden="true" /> : null}
      {name}
    </span>
  )
}
