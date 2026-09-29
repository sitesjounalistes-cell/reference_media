import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * REFERENCE.COM — recréation vectorielle du logo.
 *
 * Géométrie mesurée sur l'original (public/logo-reference.png) :
 * - ratio ≈ 4:1, coins arrondis ≈ 18 % de la hauteur ;
 * - séparation diagonale « / » (le bord supérieur de la zone rouge est
 *   plus à droite que son bord inférieur, ~16° par rapport à la verticale) ;
 * - zone bleue #1B5FD9 à gauche, zone rouge #E8192C à droite, contact direct ;
 * - « REFERENCE » en blanc, extra-gras italique, hauteur de cap ≈ 50 % ;
 * - point du « .COM » : disque blanc entièrement dans la zone rouge,
 *   juste après la coupure, posé sur la ligne de base.
 *
 * `textLength` + `lengthAdjust` garantissent un lettrage calé au pixel
 * quel que soit l'état de chargement de la police (Archivo condensé).
 */
export function Logo({
  className,
  compact = false,
  ...props
}: React.ComponentProps<"svg"> & { compact?: boolean }) {
  const clipId = `reference-logo-clip-${React.useId().replace(/:/g, "")}`

  const fontStyle: React.CSSProperties = {
    fontFamily: "var(--font-display), ui-sans-serif, system-ui, sans-serif",
    fontWeight: 900,
    fontStyle: "italic",
  }

  if (compact) {
    return (
      <svg
        viewBox="0 0 200 200"
        className={cn("h-9 w-9 shrink-0", className)}
        role="img"
        aria-label="REFERENCE.COM"
        {...props}
      >
        <title>REFERENCE.COM</title>
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="200" height="200" rx="44" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect width="200" height="200" fill="#1B5FD9" />
          <polygon points="128,0 200,0 200,200 71,200" fill="#E8192C" />
        </g>
        <text
          x="28"
          y="138"
          fontSize="110"
          textLength="56"
          lengthAdjust="spacingAndGlyphs"
          fill="#FFFFFF"
          stroke="#FFFFFF"
          strokeWidth="4"
          paintOrder="stroke fill"
          style={fontStyle}
        >
          R
        </text>
        <circle cx="118" cy="124" r="14" fill="#FFFFFF" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 800 200"
      className={cn("h-8 w-auto shrink-0", className)}
      role="img"
      aria-label="REFERENCE.COM"
      {...props}
    >
      <title>REFERENCE.COM</title>
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width="800" height="200" rx="36" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="800" height="200" fill="#1B5FD9" />
        <polygon points="554,0 800,0 800,200 496,200" fill="#E8192C" />
      </g>
      <g
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="5"
        paintOrder="stroke fill"
        style={fontStyle}
      >
        <text
          x="21"
          y="147"
          fontSize="138"
          textLength="495"
          lengthAdjust="spacingAndGlyphs"
        >
          REFERENCE
        </text>
        <text
          x="561"
          y="147"
          fontSize="138"
          textLength="224"
          lengthAdjust="spacingAndGlyphs"
        >
          COM
        </text>
      </g>
      <circle cx="538" cy="132" r="13" fill="#FFFFFF" />
    </svg>
  )
}
