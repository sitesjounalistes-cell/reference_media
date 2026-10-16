import * as React from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

/**
 * Referencemedia.info — logo officiel.
 *
 * Fichier /logo-reference.png (808×187 px, pillule bleu/rouge sur fond blanc opaque).
 *  - défaut   : logo complet, hauteur contrôlée par className (fond blanc requis).
 *  - `onDark` : pose le logo sur une pastille blanche arrondie (fonds navy/zinc).
 *  - `compact`: contenu contraint dans un conteneur carré (object-contain).
 */
export function Logo({
  className,
  compact = false,
  onDark = false,
  ...props
}: React.ComponentProps<"span"> & { compact?: boolean; onDark?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        onDark && "rounded-md bg-white px-1.5 py-1 shadow-sm",
        className
      )}
      role="img"
      aria-label="Referencemedia.info"
      {...props}
    >
      <Image
        src="/logo-reference.png"
        alt="Referencemedia.info — Votre site de référence"
        width={808}
        height={187}
        className={cn(
          "object-contain",
          compact ? "h-full w-full" : "h-full w-auto"
        )}
        priority
      />
    </span>
  )
}
