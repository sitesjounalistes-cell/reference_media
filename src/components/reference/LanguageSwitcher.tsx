"use client"

/**
 * Sélecteur de langue du site public : liste déroulante compacte
 * (FR / EN / ES / IT / AR / ZH) disposée dans la barre d'en-tête.
 */
import * as React from "react"

import { Check, Globe } from "lucide-react"

import { cn } from "@/lib/utils"
import { LANGUAGES } from "@/lib/i18n"
import { useI18n } from "@/components/reference/lang-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n()
  const current = LANGUAGES.find((entry) => entry.code === lang)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-11 items-center gap-1.5 px-2.5 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
          className
        )}
        aria-label={t("lang.choose")}
      >
        <Globe className="size-[18px]" aria-hidden="true" />
        <span className="font-mono text-xs font-bold tracking-wider">
          {current?.short ?? "FR"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-none min-w-40">
        <DropdownMenuLabel className="kicker text-muted-foreground">
          {t("lang.choose")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((entry) => (
          <DropdownMenuItem
            key={entry.code}
            onClick={() => setLang(entry.code)}
            className={cn(
              "gap-2 rounded-none",
              entry.code === lang && "font-bold"
            )}
          >
            <Check
              className={cn("size-3.5", entry.code === lang ? "opacity-100" : "opacity-0")}
              aria-hidden="true"
            />
            <span className="flex-1">{entry.label}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{entry.short}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
