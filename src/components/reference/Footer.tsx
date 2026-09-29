"use client"

import * as React from "react"

import { toast } from "@/hooks/use-toast"
import {
  channelHref,
  getChannelIcon,
  getSocialIcon,
  getSocialLabel,
  useFetch,
} from "@/components/reference/lib"
import { Logo } from "@/components/reference/Logo"
import { NewsletterForm } from "@/components/reference/NewsletterForm"
import type {
  Category,
  ContactChannelDto,
  Navigate,
  SiteSettingsResponse,
  SocialLinkDto,
} from "@/components/reference/types"

interface FooterProps {
  navigate: Navigate
  categories: Category[]
  onOpenSearch: () => void
}

/** Mention de droits affichée faute de footerNote configuré côté cockpit. */
const FALLBACK_FOOTER_NOTE =
  "© 2025 REFERENCE.COM — Comprendre le monde, article par article."

function demoPageToast() {
  toast({
    title: "Page de démonstration",
    description: "Cette page n’est pas disponible dans cette version de démonstration.",
  })
}

/** Carré social bordé (40 px, angles droits) pour une plateforme du cockpit. */
function SocialButton({ social }: { social: SocialLinkDto }) {
  const Icon = getSocialIcon(social.platform)
  const label = getSocialLabel(social.platform)
  return (
    <li>
      <a
        href={social.url}
        target="_blank"
        rel="noopener noreferrer"
        title={label}
        aria-label={`Suivre REFERENCE.COM sur ${label}`}
        className="flex size-10 items-center justify-center border border-white/15 text-zinc-300 transition-colors hover:border-brand-blue hover:bg-brand-blue hover:text-white outline-none focus-visible:ring-[3px] focus-visible:ring-white/30"
      >
        <Icon className="size-4" aria-hidden="true" />
      </a>
    </li>
  )
}

/** Ligne « label : valeur » de l’annuaire de contact (mailto: / tel:). */
function ContactLine({ channel }: { channel: ContactChannelDto }) {
  const Icon = getChannelIcon(channel.type)
  const href = channelHref(channel.type, channel.value)
  return (
    <li className="flex items-start gap-2.5 text-sm text-zinc-400">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-zinc-500" aria-hidden="true" />
      {href ? (
        <a
          href={href}
          className="transition-colors hover:text-white outline-none focus-visible:ring-[3px] focus-visible:ring-white/30"
        >
          {channel.label} : {channel.value}
        </a>
      ) : (
        <span>
          {channel.label} : {channel.value}
        </span>
      )}
    </li>
  )
}

/**
 * Pied de page marine profond (#071630) — signature bicolore en tête, grande
 * manchette de marque, cinq colonnes éditoriales, barre légale inférieure.
 * Réseaux sociaux + annuaire pilotés depuis le cockpit (GET /api/settings).
 */
export function Footer({ navigate, categories, onOpenSearch }: FooterProps) {
  const linkClass =
    "text-sm text-zinc-400 transition-colors hover:text-white outline-none focus-visible:ring-[3px] focus-visible:ring-white/30"

  const headingClass = "kicker flex items-center gap-2 text-zinc-500"

  // Informations du site pilotées depuis le cockpit (GET /api/settings).
  const {
    data: settingsData,
    loading: settingsLoading,
  } = useFetch<SiteSettingsResponse>("/api/settings")

  const socials = React.useMemo(
    () =>
      (settingsData?.socials ?? [])
        .filter((social) => social.visible)
        .sort((a, b) => a.order - b.order),
    [settingsData]
  )

  const channels = React.useMemo(
    () =>
      (settingsData?.channels ?? [])
        .filter((channel) => channel.visible)
        .sort((a, b) => a.order - b.order),
    [settingsData]
  )

  const footerNote = settingsData?.settings?.footerNote?.trim() || FALLBACK_FOOTER_NOTE
  const showSocials = socials.length > 0
  const showChannels = channels.length > 0

  return (
    <footer className="band-navy-deep mt-auto pb-[env(safe-area-inset-bottom)] text-zinc-300">
      {/* Signature bicolore bleu → rouge, pleine largeur */}
      <div aria-hidden="true" className="rule-brand h-1 w-full" />

      {/* Grande manchette de marque */}
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-10 pt-12 sm:px-6 md:flex-row md:items-end md:justify-between">
        <Logo className="h-10 brightness-110" />
        <div className="md:text-right">
          <p className="headline text-lg font-bold italic text-white">
            Le portail de référence francophone.
          </p>
          <p className="kicker mt-2 text-zinc-400">
            Comprendre le monde, article par article
          </p>
        </div>
      </div>

      {/* Colonnes éditoriales */}
      <div className="mx-auto grid max-w-7xl gap-10 border-t border-white/10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 xl:grid-cols-5">
        {/* Rubriques */}
        <nav aria-label="Rubriques du pied de page">
          <h3 className={headingClass}>
            <span aria-hidden="true" className="size-1.5 bg-brand-red" />
            Rubriques
          </h3>
          <ul className="mt-5 space-y-2.5 border-l border-white/10 pl-4">
            {categories.map((category) => (
              <li key={category.slug}>
                <button
                  type="button"
                  onClick={() => navigate({ type: "category", slug: category.slug })}
                  className={`inline-flex items-center gap-2 ${linkClass}`}
                >
                  <span
                    aria-hidden="true"
                    className="size-1.5"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Navigation */}
        <nav aria-label="Navigation du pied de page">
          <h3 className={headingClass}>
            <span aria-hidden="true" className="size-1.5 bg-brand-red" />
            Navigation
          </h3>
          <ul className="mt-5 space-y-2.5 border-l border-white/10 pl-4">
            <li>
              <button type="button" onClick={() => navigate({ type: "home" })} className={linkClass}>
                Accueil
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate({ type: "dashboard" })} className={linkClass}>
                Tableau de bord
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate({ type: "about" })} className={linkClass}>
                À propos
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate({ type: "contact" })} className={linkClass}>
                Contact
              </button>
            </li>
            <li>
              <button type="button" onClick={onOpenSearch} className={linkClass}>
                Recherche
              </button>
            </li>
          </ul>
        </nav>

        {/* Contact — annuaire piloté depuis le cockpit */}
        <div>
          <h3 className={headingClass}>
            <span aria-hidden="true" className="size-1.5 bg-brand-red" />
            Contact
          </h3>
          {showChannels ? (
            <ul className="mt-5 space-y-2.5 border-l border-white/10 pl-4">
              {channels.map((channel) => (
                <ContactLine key={channel.id} channel={channel} />
              ))}
            </ul>
          ) : settingsLoading ? (
            /* Réservation de hauteur : évite un saut de mise en page au chargement. */
            <div
              className="mt-5 space-y-3 border-l border-white/10 pl-4"
              aria-hidden="true"
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <span
                  key={index}
                  className="block h-3.5 animate-pulse bg-white/10"
                  style={{ width: `${92 - index * 16}%` }}
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* Newsletter */}
        <div>
          <h3 className={headingClass}>
            <span aria-hidden="true" className="size-1.5 bg-brand-red" />
            Newsletter
          </h3>
          <p className="mt-5 text-sm leading-relaxed text-zinc-400">
            Le meilleur de nos dossiers, une fois par semaine, directement dans votre
            boîte mail.
          </p>
          <div className="mt-4">
            <NewsletterForm variant="onBlue" stacked />
          </div>
        </div>

        {/* Nous suivre — réseaux sociaux pilotés depuis le cockpit */}
        <div>
          <h3 className={headingClass}>
            <span aria-hidden="true" className="size-1.5 bg-brand-red" />
            Nous suivre
          </h3>
          {showSocials ? (
            <ul
              className="mt-5 flex flex-wrap items-center gap-2 border-l border-white/10 pl-4"
              aria-label="Réseaux sociaux de REFERENCE.COM"
            >
              {socials.map((social) => (
                <SocialButton key={social.id} social={social} />
              ))}
            </ul>
          ) : settingsLoading ? (
            /* Réservation de hauteur : évite un saut de mise en page au chargement. */
            <div className="mt-5 flex items-center gap-2 border-l border-white/10 pl-4" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <span
                  key={index}
                  className="size-10 animate-pulse border border-white/10 bg-white/5"
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Barre légale */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-zinc-500 sm:flex-row sm:px-6">
          <p>{footerNote}</p>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => navigate({ type: "cockpit" })}
              title="Espace rédaction : gestion des articles, des médias et du site"
              className="transition-colors hover:text-white outline-none focus-visible:ring-[3px] focus-visible:ring-white/30"
            >
              Cockpit rédaction
            </button>
            <button
              type="button"
              onClick={demoPageToast}
              className="transition-colors hover:text-white outline-none focus-visible:ring-[3px] focus-visible:ring-white/30"
            >
              Mentions légales
            </button>
            <button
              type="button"
              onClick={demoPageToast}
              className="transition-colors hover:text-white outline-none focus-visible:ring-[3px] focus-visible:ring-white/30"
            >
              Confidentialité
            </button>
            <button
              type="button"
              onClick={() => navigate({ type: "contact" })}
              className="transition-colors hover:text-white outline-none focus-visible:ring-[3px] focus-visible:ring-white/30"
            >
              Contact
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
