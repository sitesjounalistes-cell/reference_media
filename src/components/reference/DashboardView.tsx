"use client"

import * as React from "react"

import { motion } from "framer-motion"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts"
import {
  Activity,
  Clock,
  Eye,
  FileText,
  Inbox,
  Mail,
  Megaphone,
  MousePointerClick,
  RotateCw,
  TrendingUp,
} from "lucide-react"

import { formatViews, useFetch } from "@/components/reference/lib"
import { ErrorState } from "@/components/reference/ErrorState"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { Navigate } from "@/components/reference/types"
import type { DashboardResponse } from "@/components/reference/types"

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const SUBJECT_LABELS: Record<string, string> = {
  redaction: "Rédaction",
  correction: "Correction",
  partenariat: "Partenariat",
  publicite: "Publicité",
  droits: "Droits",
  autre: "Autre",
}

function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    })
  } catch {
    return ""
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return ""
  }
}

/* -------------------------------------------------------------------------- */
/*                              Têtes de section                              */
/* -------------------------------------------------------------------------- */

function PanelHeading({
  id,
  label,
  title,
  action,
}: {
  id: string
  label: string
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-4 border-b-2 border-foreground pb-3">
      <div className="min-w-0">
        <p className="kicker flex items-center gap-2 text-brand-red">
          <span aria-hidden="true" className="brand-square bg-brand-red" />
          {label}
        </p>
        <h2
          id={id}
          className="mt-1.5 font-serif text-xl font-bold tracking-tight md:text-2xl"
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  KPI cell                                  */
/* -------------------------------------------------------------------------- */

function KpiCell({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="flex flex-col gap-2.5 bg-background p-4 md:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="kicker text-muted-foreground">{label}</p>
        <Icon className="size-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
      </div>
      <p className="editorial-num text-3xl tabular-nums text-brand-blue md:text-4xl">
        {value}
      </p>
      <span aria-hidden="true" className="rule-brand h-[3px] w-10" />
      <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
        {sub}
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Config graphiques                             */
/* -------------------------------------------------------------------------- */

const TRAFFIC_CONFIG = {
  views: { label: "Lectures estimées", color: "#1B5FD9" },
} satisfies ChartConfig

const CATEGORY_CONFIG = {
  views: { label: "Lectures" },
} satisfies ChartConfig

const ADS_CONFIG = {
  impressions: { label: "Impressions", color: "#1B5FD9" },
  clicks: { label: "Clics", color: "#E8192C" },
} satisfies ChartConfig

/* -------------------------------------------------------------------------- */
/*                             État de chargement                             */
/* -------------------------------------------------------------------------- */

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex items-end justify-between gap-4 border-b-2 border-foreground pb-5">
        <div className="space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-72" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-px border bg-border md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 border-0 bg-background" />
        ))}
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
      <Skeleton className="mt-10 h-96" />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                               DashboardView                                */
/* -------------------------------------------------------------------------- */

export function DashboardView({ navigate }: { navigate: Navigate }) {
  const { data, error, loading, retry } = useFetch<DashboardResponse>(
    "/api/dashboard"
  )

  const openArticle = React.useCallback(
    (slug: string) => navigate({ type: "article", slug }),
    [navigate]
  )
  const openCategory = React.useCallback(
    (slug: string) => navigate({ type: "category", slug }),
    [navigate]
  )

  if (loading) return <DashboardSkeleton />

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <ErrorState message={error ?? "Erreur inconnue"} onRetry={retry} />
      </div>
    )
  }

  const { kpis, traffic, adSeries, categories, topArticles, campaigns } = data

  return (
    <div className="pb-4">
      {/* ------------------------------ En-tête ------------------------------- */}
      <header className="band-paper border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-12">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker flex items-center gap-2 text-[#c8102c]">
                <span aria-hidden="true" className="brand-square bg-brand-red" />
                Rédaction — Pilotage éditorial
              </p>
              <h1 className="headline mt-3 text-3xl font-black tracking-tight text-zinc-950 md:text-[2.6rem] md:leading-[1.1]">
                Tableau de bord
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 md:text-base">
                Vue d&apos;ensemble de l&apos;audience, des contenus et de la
                régie publicitaire. Les données sont consolidées en direct
                depuis la base de la rédaction.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em] text-zinc-600">
                <span
                  aria-hidden="true"
                  className="pulse-dot size-2 bg-brand-red"
                />
                Données en direct
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={retry}
                className="h-9 border-2 border-[#0a1e3c] bg-transparent px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a1e3c] hover:bg-[#0a1e3c] hover:text-white"
              >
                <RotateCw aria-hidden="true" />
                Actualiser
              </Button>
            </div>
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            Dernière consolidation : {formatDateTime(data.generatedAt)} — période
            publicitaire glissante de 14 jours.
          </p>
          <div aria-hidden="true" className="rule-brand mt-6 h-1 w-24" />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* ------------------------------ KPIs ------------------------------- */}
        <section aria-labelledby="kpis-title">
          <PanelHeading id="kpis-title" label="Indicateurs clés" title="L'essentiel en un regard" />
          <div className="mt-6 grid grid-cols-2 gap-px border bg-border md:grid-cols-4">
            <KpiCell
              icon={FileText}
              label="Articles publiés"
              value={kpis.articles.toLocaleString("fr-FR")}
              sub={`${kpis.categories} rubriques · ${kpis.authors} auteurs`}
            />
            <KpiCell
              icon={Eye}
              label="Lectures cumulées"
              value={formatViews(kpis.totalViews)}
              sub="depuis le lancement"
            />
            <KpiCell
              icon={Mail}
              label="Abonnés newsletter"
              value={kpis.subscribers.toLocaleString("fr-FR")}
              sub="liste e-mail active"
            />
            <KpiCell
              icon={Inbox}
              label="Messages reçus"
              value={kpis.messages.toLocaleString("fr-FR")}
              sub="formulaire de contact"
            />
            <KpiCell
              icon={Megaphone}
              label="Impressions pub"
              value={formatViews(kpis.adImpressions)}
              sub="14 derniers jours"
            />
            <KpiCell
              icon={MousePointerClick}
              label="Clics publicitaires"
              value={formatViews(kpis.adClicks)}
              sub="14 derniers jours"
            />
            <KpiCell
              icon={TrendingUp}
              label="CTR publicitaire"
              value={`${kpis.adCtr.toLocaleString("fr-FR")} %`}
              sub="moyenne presse en ligne : 1 – 2 %"
            />
            <KpiCell
              icon={Clock}
              label="Temps de lecture"
              value={`${kpis.avgReadMinutes.toLocaleString("fr-FR")} min`}
              sub="moyenne par article"
            />
          </div>
        </section>

        {/* --------------------------- Graphiques ----------------------------- */}
        <section
          aria-labelledby="charts-title"
          className="mt-12 grid gap-10 lg:grid-cols-3"
        >
          <div className="lg:col-span-2">
            <PanelHeading
              id="charts-title"
              label="Audience"
              title="Lectures estimées — 14 derniers jours"
            />
            <div className="mt-6 border bg-background p-4 md:p-6">
              <ChartContainer
                config={TRAFFIC_CONFIG}
                className="aspect-auto h-[280px] w-full"
              >
                <AreaChart data={traffic} margin={{ left: 4, right: 12, top: 8 }}>
                  <defs>
                    <linearGradient id="fillTraffic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-views)" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="var(--color-views)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={18}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={44}
                    tickFormatter={(value: number) => formatViews(value)}
                  />
                  <ChartTooltip
                    cursor={{ strokeDasharray: "4 4" }}
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        formatter={(value) => (
                          <span className="font-mono font-medium tabular-nums">
                            {Number(value).toLocaleString("fr-FR")} lectures
                          </span>
                        )}
                      />
                    }
                  />
                  <Area
                    dataKey="views"
                    type="natural"
                    stroke="var(--color-views)"
                    strokeWidth={2}
                    fill="url(#fillTraffic)"
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                </AreaChart>
              </ChartContainer>
              <p className="mt-3 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">
                Estimation déterministe répartissant les lectures cumulées de
                chaque article sur la période, pondérée par la récence.
              </p>
            </div>
          </div>

          {/* Répartition par rubrique */}
          <div>
            <PanelHeading id="categories-title" label="Contenus" title="Lectures par rubrique" />
            <div className="mt-6 border bg-background p-4 md:p-6">
              <ChartContainer
                config={CATEGORY_CONFIG}
                className="aspect-auto h-[280px] w-full"
              >
                <BarChart
                  data={categories}
                  layout="vertical"
                  margin={{ left: 0, right: 24, top: 4 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={88}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip
                    cursor={{ fill: "var(--muted)" }}
                    content={
                      <ChartTooltipContent
                        formatter={(value, name, item) => (
                          <span className="font-mono font-medium tabular-nums">
                            {Number(value).toLocaleString("fr-FR")} lectures ·{" "}
                            {(
                              item?.payload as { share?: number } | undefined
                            )?.share?.toLocaleString("fr-FR") ?? 0}{" "}
                            %
                          </span>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="views" radius={0} barSize={16}>
                    {categories.map((category) => (
                      <Cell key={category.slug} fill={category.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        </section>

        {/* --------------------------- Régie publicitaire --------------------- */}
        <section aria-labelledby="ads-title" className="mt-12">
          <PanelHeading
            id="ads-title"
            label="Régie publicitaire"
            title="Performance des campagnes — 14 derniers jours"
          />
          <div className="mt-6 grid gap-8 lg:grid-cols-5 lg:gap-10">
            {/* Graphique impressions / clics */}
            <div className="border bg-background p-4 md:p-6 lg:col-span-2">
              <ChartContainer
                config={ADS_CONFIG}
                className="aspect-auto h-[260px] w-full"
              >
                <ComposedChart data={adSeries} margin={{ left: 0, right: 4, top: 8 }}>
                  <defs>
                    <linearGradient id="fillAds" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-impressions)" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="var(--color-impressions)" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={18}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    tickFormatter={(value: number) => formatViews(value)}
                  />
                  <YAxis yAxisId="clicks" orientation="right" hide />
                  <ChartTooltip
                    cursor={{ strokeDasharray: "4 4" }}
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <span className="font-mono font-medium tabular-nums">
                            {Number(value).toLocaleString("fr-FR")}{" "}
                            {name === "impressions" ? "impressions" : "clics"}
                          </span>
                        )}
                      />
                    }
                  />
                  <Area
                    dataKey="impressions"
                    type="monotone"
                    stroke="var(--color-impressions)"
                    strokeWidth={2}
                    fill="url(#fillAds)"
                    dot={false}
                  />
                  <Line
                    yAxisId="clicks"
                    dataKey="clicks"
                    type="monotone"
                    stroke="var(--color-clicks)"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 4"
                  />
                </ComposedChart>
              </ChartContainer>
              <div className="mt-3 flex items-center gap-5 border-t pt-3 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-2 bg-brand-blue" />
                  Impressions
                </span>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-2 bg-brand-red" />
                  Clics
                </span>
              </div>
            </div>

            {/* Tableau des campagnes */}
            <div className="lg:col-span-3">
              <div className="max-h-[340px] overflow-y-auto border nice-scrollbar">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background">
                    <TableRow className="border-b hover:bg-transparent">
                      <TableHead className="kicker h-11 text-muted-foreground">Campagne</TableHead>
                      <TableHead className="kicker h-11 text-right text-muted-foreground">Impressions</TableHead>
                      <TableHead className="kicker h-11 text-right text-muted-foreground">Clics</TableHead>
                      <TableHead className="kicker h-11 text-right text-muted-foreground">CTR</TableHead>
                      <TableHead className="kicker h-11 text-right text-muted-foreground">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id} className="border-b">
                        <TableCell className="py-3.5">
                          <div className="flex items-center gap-3">
                            <span
                              aria-hidden="true"
                              className="size-2.5 shrink-0"
                              style={{ backgroundColor: campaign.color }}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {campaign.name}
                              </p>
                              <p className="truncate text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                                {campaign.advertiser} · {campaign.slots.join(", ")}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 text-right font-mono text-sm tabular-nums">
                          {campaign.impressions.toLocaleString("fr-FR")}
                        </TableCell>
                        <TableCell className="py-3.5 text-right font-mono text-sm tabular-nums">
                          {campaign.clicks.toLocaleString("fr-FR")}
                        </TableCell>
                        <TableCell className="py-3.5 text-right font-mono text-sm tabular-nums">
                          <span
                            className={cn(
                              campaign.ctr >= 2.5
                                ? "text-brand-blue"
                                : "text-foreground"
                            )}
                          >
                            {campaign.ctr.toLocaleString("fr-FR")} %
                          </span>
                        </TableCell>
                        <TableCell className="py-3.5 text-right">
                          <span className="inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]">
                            <span
                              aria-hidden="true"
                              className={cn(
                                "size-1.5",
                                campaign.active ? "bg-brand-blue" : "bg-muted-foreground/40"
                              )}
                            />
                            {campaign.active ? "Active" : "En pause"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------- Top articles + flux récents ------------------ */}
        <section aria-labelledby="top-title" className="mt-12 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PanelHeading id="top-title" label="Contenus" title="Articles les plus lus" />
            <div className="mt-6 border bg-background">
              <Table>
                <TableHeader>
                  <TableRow className="border-b hover:bg-transparent">
                    <TableHead className="kicker h-11 w-12 text-muted-foreground">#</TableHead>
                    <TableHead className="kicker h-11 text-muted-foreground">Article</TableHead>
                    <TableHead className="kicker h-11 text-right text-muted-foreground">Lectures</TableHead>
                    <TableHead className="kicker hidden h-11 text-right text-muted-foreground sm:table-cell">
                      Publié
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topArticles.map((article, index) => (
                    <TableRow
                      key={article.slug}
                      className="cursor-pointer border-b"
                      onClick={() => openArticle(article.slug)}
                    >
                      <TableCell className="editorial-num py-3.5 text-base tabular-nums text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            openArticle(article.slug)
                          }}
                          className="text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          <p className="font-serif text-[15px] font-bold leading-snug tracking-tight transition-colors hover:text-brand-red">
                            {article.title}
                          </p>
                          <p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                            {article.author.name} · {article.readMinutes} min
                          </p>
                        </button>
                      </TableCell>
                      <TableCell className="py-3.5 text-right">
                        <span
                          className="inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-xs tabular-nums"
                          style={{
                            borderColor: `${article.category.color}59`,
                            color: article.category.color,
                          }}
                        >
                          <Eye className="size-3" aria-hidden="true" />
                          {formatViews(article.views)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden py-3.5 text-right text-xs tabular-nums text-muted-foreground sm:table-cell">
                        {formatDateShort(article.publishedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                Explorer :
              </p>
              {categories.slice(0, 4).map((category) => (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() => openCategory(category.slug)}
                  className="inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors hover:bg-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  style={{ color: category.color }}
                >
                  <span
                    aria-hidden="true"
                    className="size-1.5"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Flux récents (anonymisés : aucune donnée personnelle sur la page publique) */}
          <div className="space-y-10">
            <div>
              <PanelHeading id="subs-title" label="Newsletter" title="Derniers abonnements" />
              <ul className="mt-5 divide-y border">
                {data.subscribers.map((subscriber, index) => (
                  <li
                    key={`${subscriber.createdAt}-${index}`}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Mail className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden="true" />
                      <span className="truncate text-sm">Nouvel abonné confirmé</span>
                    </span>
                    <time
                      dateTime={subscriber.createdAt}
                      className="shrink-0 text-[11px] tabular-nums text-muted-foreground"
                    >
                      {formatDateShort(subscriber.createdAt)}
                    </time>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <PanelHeading id="msgs-title" label="Contact" title="Derniers messages" />
              <ul className="mt-5 divide-y border">
                {data.messages.map((message, index) => (
                  <li
                    key={`${message.subject}-${index}`}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {SUBJECT_LABELS[message.subject] ?? message.subject}
                      </span>
                      <span className="block text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                        Message reçu par la rédaction
                      </span>
                    </span>
                    <time
                      dateTime={message.createdAt}
                      className="shrink-0 text-[11px] tabular-nums text-muted-foreground"
                    >
                      {formatDateShort(message.createdAt)}
                    </time>
                  </li>
                ))}
              </ul>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-start gap-3 border-l-2 border-brand-red bg-muted/40 p-4"
            >
              <Activity className="mt-0.5 size-4 shrink-0 text-brand-red" aria-hidden="true" />
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Les impressions et clics affichés incluent le trafic réel
                enregistré pendant votre visite sur le site.
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  )
}
