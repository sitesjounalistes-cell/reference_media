import * as React from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

/**
 * Referencemedia.info — logo officiel.
 *
 * Utilise le fichier PNG /logo-reference.png (689×159 px, fond transparent).
 * Deux variantes :
 *  - default  : logo complet, largeur auto, hauteur contrôlée par className.
 *  - compact  : carré, recadré sur la bulle rouge/bleue (favicon-like).
 */
export function Logo({
  className,
  compact = false,
  ...props
}: React.ComponentProps<"span"> & { compact?: boolean }) {
  if (compact) {
    return (
      <span
        className={cn("inline-flex shrink-0 items-center justify-center", className)}
        role="img"
        aria-label="Referencemedia.info"
        {...props}
      >
        {/* Version carrée : on affiche quand même le logo complet, centré */}
        <Image
          src="/logo-reference.png"
          alt="Referencemedia.info — Votre site de référence"
          width={159}
          height={37}
          className="h-full w-auto object-contain"
          priority
        />
      </span>
    )
  }

  return (
    <span
      className={cn("inline-flex shrink-0 items-center", className)}
      role="img"
      aria-label="Referencemedia.info"
      {...props}
    >
      <Image
        src="/logo-reference.png"
        alt="Referencemedia.info — Votre site de référence"
        width={1774}
        height={409}
        className="h-full w-auto object-contain"
        priority
      />
    </span>
  )
}
