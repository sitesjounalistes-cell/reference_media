"use client"

/**
 * REFERENCE.COM — Contexte de langue du site public.
 *
 * - persiste la langue choisie (localStorage) ;
 * - expose `t(key, params)` pour les libellés d'interface ;
 * - bascule `dir="rtl"` sur <html> pour l'arabe ;
 * - le changement de langue recharge la page : les composants relisent
 *   leurs données avec ?lang= (articles traduits côté serveur), sans état
 *   intermédiaire incohérent.
 */
import * as React from "react"

import {
  DEFAULT_LANG,
  isLang,
  isRtl,
  translateUi,
  type Lang,
  type TranslationKey,
} from "@/lib/i18n"
import { useFetch, type AsyncState } from "@/components/reference/lib"

const STORAGE_KEY = "reference-lang"

interface I18nContextValue {
  lang: Lang
  rtl: boolean
  /** Libellé d'interface dans la langue courante (repli français). */
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
  /** Change la langue affichée (persiste puis recharge). */
  setLang: (lang: Lang) => void
}

const I18nContext = React.createContext<I18nContextValue | null>(null)

function readStoredLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return isLang(stored) ? stored : DEFAULT_LANG
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Le premier rendu (serveur) utilise le français ; la langue mémorisée
  // est appliquée dès l'hydratation côté client.
  const [lang, setLangState] = React.useState<Lang>(DEFAULT_LANG)

  React.useEffect(() => {
    const stored = readStoredLang()
    if (stored !== DEFAULT_LANG) {
      setLangState(stored)
      document.documentElement.lang = stored
      document.documentElement.dir = isRtl(stored) ? "rtl" : "ltr"
    }
  }, [])

  const setLang = React.useCallback((next: Lang) => {
    if (next === readStoredLang()) return
    window.localStorage.setItem(STORAGE_KEY, next)
    // Recharge : chaque composant relit ses données dans la nouvelle langue.
    window.location.reload()
  }, [])

  const value = React.useMemo<I18nContextValue>(
    () => ({
      lang,
      rtl: isRtl(lang),
      t: (key, params) => translateUi(lang, key, params),
      setLang,
    }),
    [lang, setLang]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = React.useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n doit être utilisé dans <I18nProvider>")
  }
  return context
}

/**
 * useFetch enrichi : ajoute ?lang= automatiquement quand une langue
 * étrangère est active (le serveur traduit les contenus avec son cache).
 */
export function useI18nFetch<T>(url: string | null): AsyncState<T> {
  const { lang } = useI18n()
  const localized = React.useMemo(() => {
    if (!url || lang === DEFAULT_LANG) return url
    return `${url}${url.includes("?") ? "&" : "?"}lang=${lang}`
  }, [url, lang])
  return useFetch<T>(localized)
}
