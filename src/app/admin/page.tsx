"use client"

/**
 * REFERENCE.COM — Accès administration : /admin.
 * Porte d'entrée unique du cockpit (tableau de bord, articles, médias, FM/TV…),
 * protégée par la session administrateur (voir CockpitLogin).
 */
import * as React from "react"

import { CockpitView } from "@/components/reference/CockpitView"
import type { Navigate } from "@/components/reference/types"

export default function AdminPage() {
  // Navigation vers le site public : retour à l'accueil, ou ouverture
  // directe d'un article en aperçu (paramètre lu par la page publique).
  const navigate = React.useCallback<Navigate>((view) => {
    if (view.type === "article") {
      window.location.href = `/?article=${encodeURIComponent(view.slug)}`
      return
    }
    window.location.href = "/"
  }, [])

  return <CockpitView navigate={navigate} />
}
