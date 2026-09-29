"use client"

import * as React from "react"

import { motion } from "framer-motion"
import { Lightbulb, Scale, ShieldCheck, type LucideIcon } from "lucide-react"

import { useFetch } from "@/components/reference/lib"
import { Logo } from "@/components/reference/Logo"
import { NewsletterForm } from "@/components/reference/NewsletterForm"
import { Skeleton } from "@/components/ui/skeleton"
import type {
  ArticlesResponse,
  Category,
  Navigate,
  SiteSettingsResponse,
} from "@/components/reference/types"

interface AboutViewProps {
  navigate: Navigate
  categories: Category[]
}

const TEAM = [
  {
    name: "Claire Fontaine",
    role: "Rédactrice en chef",
    bio: "Passionnée de vulgarisation scientifique depuis toujours, Claire dirige la rédaction avec une obsession : la rigueur sans l'ennui.",
    initials: "CF",
  },
  {
    name: "Marc Duval",
    role: "Journaliste sciences & technologies",
    bio: "Ancien ingénieur reconverti dans le journalisme, Marc traduit la technique en histoires humaines.",
    initials: "MD",
  },
  {
    name: "Sophie Marchand",
    role: "Historienne",
    bio: "Docteure en histoire, Sophie croque les grandes et petites histoires qui ont fait le monde.",
    initials: "SM",
  },
  {
    name: "Julien Lefèvre",
    role: "Spécialiste économie",
    bio: "Julien démystifie l'économie avec des exemples de la vie de tous les jours.",
    initials: "JL",
  },
  {
    name: "Amina Benali",
    role: "Journaliste santé & société",
    bio: "Amina enquête sur les liens entre corps, esprit et société.",
    initials: "AB",
  },
  {
    name: "Thomas Girard",
    role: "Reporter nature & environnement",
    bio: "Thomas a parcouru les forêts et océans du monde entier pour documenter la crise écologique… et les raisons d'espérer.",
    initials: "TG",
  },
]

const VALUES: Array<{ icon: LucideIcon; title: string; text: string }> = [
  {
    icon: ShieldCheck,
    title: "Rigueur",
    text: "Chaque dossier est vérifié, sourcé et relu. Quand la science hésite, nous le disons.",
  },
  {
    icon: Lightbulb,
    title: "Clarté",
    text: "Un concept complexe mérite une explication simple. Nous écrivons pour vous, pas pour nos pairs.",
  },
  {
    icon: Scale,
    title: "Indépendance",
    text: "Aucune marque, aucun parti, aucune idéologie ne dicte nos analyses. Notre seule loyauté : les faits.",
  },
]

/** Vue « À propos » : manifeste, chiffres, principes, équipe, newsletter. */
export function AboutView({ navigate, categories }: AboutViewProps) {
  const stats = useFetch<ArticlesResponse>("/api/articles?pageSize=1")
  const articleCount = stats.data?.total ?? null

  // Manifeste éditorial piloté depuis le cockpit (fallback : signature maison).
  const settingsState = useFetch<SiteSettingsResponse>("/api/settings")
  const aboutLead =
    settingsState.data?.settings?.aboutLead?.trim() ||
    "Comprendre le monde, article par article."

  const openCategory = React.useCallback(
    (slug: string) => navigate({ type: "category", slug }),
    [navigate]
  )

  return (
    <div className="pb-4">
      {/* ------------------------------ Manifeste ------------------------------ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        aria-labelledby="about-title"
        className="band-paper border-b border-zinc-200"
      >
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#c8102c]">
            <span aria-hidden="true" className="size-2 shrink-0 bg-brand-red" />
            À propos
          </p>
          <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h1
              id="about-title"
              className="headline max-w-3xl text-3xl font-black leading-[1.08] text-zinc-950 md:text-5xl"
            >
              {aboutLead}
            </h1>
            <Logo className="h-10 shrink-0 md:h-12" />
          </div>
          <div aria-hidden="true" className="rule-brand mt-8 h-1 w-24" />
        </div>
      </motion.section>

      {/* ------------------- Mission + chiffres clés (2 colonnes) -------------- */}
      <section
        aria-label="Notre mission et nos chiffres"
        className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 md:pt-16"
      >
        <div className="grid gap-10 lg:grid-cols-3 lg:gap-14">
          {/* Texte de mission */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-2"
          >
            <p className="kicker flex items-center gap-2 text-brand-red">
              <span aria-hidden="true" className="brand-square bg-brand-red" />
              Notre mission
            </p>
            <p className="drop-cap mt-5 font-serif text-lg leading-[1.85] text-foreground/90 md:text-xl md:leading-[1.85]">
              REFERENCE.COM est un portail de connaissance francophone indépendant.
              Notre mission : prendre les questions que tout le monde se pose —
              pourquoi le ciel est bleu, comment fonctionne l&apos;IA, que valent
              vraiment les chiffres de l&apos;inflation — et y répondre avec rigueur,
              clarté et honnêteté.
            </p>
            <p className="mt-5 font-serif text-lg leading-[1.85] text-foreground/90 md:text-xl md:leading-[1.85]">
              Trois principes guident chacune de nos pages : la rigueur, la clarté
              et l&apos;indépendance. Le reste — les rubriques, les formats, la
              newsletter — n&apos;existe que pour les servir.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <span aria-hidden="true" className="size-2 shrink-0 bg-brand-red" />
              La rédaction de REFERENCE.COM
            </p>
          </motion.div>

          {/* Encart marine « Chiffres clés » */}
          <motion.aside
            aria-label="Chiffres clés"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="band-navy h-fit p-6 text-white md:p-8"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              Chiffres clés
            </p>
            <div aria-hidden="true" className="rule-brand mt-3 h-1 w-16" />
            <div className="mt-6 divide-y divide-white/10">
              <div className="py-5 first:pt-0 last:pb-0">
                <span className="editorial-num block text-4xl text-white md:text-5xl">
                  {articleCount ?? <Skeleton className="h-10 w-16 bg-white/20" />}
                </span>
                <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                  articles publiés
                </span>
              </div>
              <div className="py-5 first:pt-0 last:pb-0">
                <span className="editorial-num block text-4xl text-white md:text-5xl">
                  {categories.length || (
                    <Skeleton className="h-10 w-16 bg-white/20" />
                  )}
                </span>
                <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                  rubriques
                </span>
              </div>
              <div className="py-5 first:pt-0 last:pb-0">
                <span className="editorial-num block text-4xl text-white md:text-5xl">
                  {TEAM.length}
                </span>
                <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                  journalistes
                </span>
              </div>
            </div>
          </motion.aside>
        </div>
      </section>

      {/* -------------------------------- Valeurs ------------------------------ */}
      <section
        aria-labelledby="values-heading"
        className="mx-auto max-w-7xl px-4 pt-16 sm:px-6"
      >
        <div className="border-b-2 border-foreground pb-3">
          <p className="kicker flex items-center gap-2 text-brand-red">
            <span aria-hidden="true" className="brand-square bg-brand-red" />
            Notre charte
          </p>
          <h2
            id="values-heading"
            className="headline mt-1.5 text-2xl font-bold tracking-tight md:text-[1.75rem]"
          >
            Nos principes
          </h2>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-3">
          {VALUES.map((value, index) => {
            const Icon = value.icon
            return (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: index * 0.07 }}
                className="bg-background p-6 md:p-7"
              >
                <span
                  aria-hidden="true"
                  className="flex size-11 items-center justify-center bg-brand-blue/10 text-brand-blue"
                >
                  <Icon className="size-5" />
                </span>
                <span
                  aria-hidden="true"
                  className="editorial-num mt-4 block text-sm text-muted-foreground/50"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="headline mt-1.5 text-xl font-bold tracking-tight">
                  {value.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {value.text}
                </p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* -------------------------------- Équipe ------------------------------- */}
      <section
        aria-labelledby="team-heading"
        className="mx-auto max-w-7xl px-4 pt-16 sm:px-6"
      >
        <div className="border-b-2 border-foreground pb-3">
          <p className="kicker flex items-center gap-2 text-brand-red">
            <span aria-hidden="true" className="brand-square bg-brand-red" />
            La rédaction
          </p>
          <h2
            id="team-heading"
            className="headline mt-1.5 text-2xl font-bold tracking-tight md:text-[1.75rem]"
          >
            L&apos;équipe éditoriale
          </h2>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((member, index) => (
            <motion.article
              key={member.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: (index % 3) * 0.06 }}
              className="bg-background p-6"
            >
              <div className="flex items-center gap-3.5">
                <span
                  aria-hidden="true"
                  className="flex size-12 shrink-0 items-center justify-center bg-brand-blue text-sm font-bold text-white"
                >
                  {member.initials}
                </span>
                <div className="min-w-0">
                  <h3 className="headline truncate text-base font-bold tracking-tight">
                    {member.name}
                  </h3>
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-brand-blue">
                    {member.role}
                  </p>
                </div>
              </div>
              <p className="mt-3.5 text-sm leading-relaxed text-muted-foreground">
                {member.bio}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ------------------------------ Catégories ----------------------------- */}
      <section
        aria-labelledby="about-categories"
        className="mx-auto max-w-7xl px-4 pt-16 sm:px-6"
      >
        <div className="border-b-2 border-foreground pb-3">
          <p className="kicker flex items-center gap-2 text-brand-red">
            <span aria-hidden="true" className="brand-square bg-brand-red" />
            Nos univers
          </p>
          <h2
            id="about-categories"
            className="headline mt-1.5 text-2xl font-bold tracking-tight md:text-[1.75rem]"
          >
            Huit rubriques, une même exigence
          </h2>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => openCategory(category.slug)}
              className="inline-flex min-h-11 items-center gap-2 border border-border bg-background px-4 text-sm font-semibold outline-none transition-colors hover:border-[#0a1e3c] hover:bg-[#0a1e3c] hover:text-white focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <span
                aria-hidden="true"
                className="size-2 shrink-0"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
              <span className="text-xs tabular-nums opacity-70">
                {category.articleCount}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ------------------------------ CTA newsletter -------------------------- */}
      <section
        aria-labelledby="about-cta"
        className="mx-auto mt-16 max-w-7xl px-4 sm:px-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4 }}
          className="band-navy-deep p-8 text-white md:p-12"
        >
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                <span aria-hidden="true" className="size-2 shrink-0 bg-brand-red" />
                Newsletter
              </p>
              <h2
                id="about-cta"
                className="headline mt-3 text-2xl font-bold tracking-tight md:text-3xl"
              >
                Restez à la référence
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-zinc-300 md:text-base">
                Un e-mail par semaine avec nos meilleurs dossiers, choisi à la main
                par la rédaction. Gratuit, sans spam, désinscription en un clic.
              </p>
            </div>
            <NewsletterForm variant="onBlue" />
          </div>
        </motion.div>
      </section>
    </div>
  )
}
