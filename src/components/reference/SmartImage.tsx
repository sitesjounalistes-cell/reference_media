"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { alpha, getCategoryIcon } from "@/components/reference/lib"

interface SmartImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string | null | undefined
  alt: string
  /** Couleur hex de la catégorie, utilisée pour le dégradé de repli. */
  fallbackColor?: string | null
  /** Nom d'icône lucide de la catégorie pour le repli. */
  fallbackIcon?: string | null
  /** Classes du conteneur (positionnement, ratio, arrondis). */
  wrapperClassName?: string
  eager?: boolean
}

/**
 * Image « intelligente » : rend l'image en lazy-loading quand `src` existe,
 * sinon un dégradé aux couleurs de la catégorie avec sa grande icône.
 */
export function SmartImage({
  src,
  alt,
  fallbackColor,
  fallbackIcon,
  wrapperClassName,
  eager = false,
  className,
  ...props
}: SmartImageProps) {
  const Icon = getCategoryIcon(fallbackIcon)

  if (!src) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "flex h-full w-full items-center justify-center overflow-hidden",
          wrapperClassName
        )}
        style={{
          backgroundImage: `linear-gradient(135deg, ${alpha(
            fallbackColor,
            0.28
          )}, ${alpha(fallbackColor, 0.62)})`,
        }}
      >
        <Icon
          className="h-1/3 w-1/3 max-h-24 max-w-24 text-white/80"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={cn("object-cover w-full h-full", className)}
      {...props}
    />
  )
}
