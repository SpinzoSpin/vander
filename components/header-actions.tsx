"use client"

import * as React from "react"
import { useSession, signOut } from "next-auth/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowUpDownIcon,
  ChevronDown,
  Notification01Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function ExchangeRatePill() {
  const [isUsdtFirst, setIsUsdtFirst] = React.useState(true)
  const [rateData, setRateData] = React.useState<{
    usdtToPhpRate: number
    phpToUsdtRate: number
    isActive: boolean
  } | null>(null)

  React.useEffect(() => {
    let active = true
    async function fetchRate() {
      try {
        const res = await fetch("/api/exchange-rate/active")
        const json = await res.json()
        if (active && json.success && json.data) {
          setRateData(json.data)
        }
      } catch (err) {
        console.error("Failed to fetch active exchange rate:", err)
      }
    }
    fetchRate()
    // Poll every 15 seconds to keep it fresh
    const interval = setInterval(fetchRate, 15000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  if (!rateData) {
    return (
      <div className="flex h-[38px] w-[180px] items-center justify-between rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#1A1A1A] p-1.5 pl-3">
        <Skeleton className="h-4 w-28 bg-neutral-100 dark:bg-white/10" />
        <Skeleton className="h-7 w-7 rounded-lg bg-neutral-100 dark:bg-white/10" />
      </div>
    )
  }

  const displayRate = isUsdtFirst
    ? rateData.usdtToPhpRate
    : rateData.phpToUsdtRate

  const activeColorClass = rateData.isActive ? "bg-active" : "bg-neutral-400 dark:bg-[#7a7a7a]"
  const activeColorBlurClass = rateData.isActive
    ? "bg-active/20"
    : "bg-neutral-400/20 dark:bg-[#7a7a7a]/20"
  const activeBorderClass = rateData.isActive
    ? "border-active/40 text-active"
    : "border-neutral-200 dark:border-white/[0.08] text-neutral-500 dark:text-[#7a7a7a]"

  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#1A1A1A] p-1.5 pl-3 shadow-sm dark:shadow-2xl">
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center">
          <div
            className={`absolute size-2.5 rounded-full ${activeColorBlurClass} blur-[2px]`}
          />
          <div className={`size-1.5 rounded-full ${activeColorClass}`} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] tracking-tight text-neutral-500 dark:text-neutral-400 uppercase">
            {isUsdtFirst ? "USDT/PHP" : "PHP/USDT"}
          </span>
          <span className="font-mono text-[13px] tracking-tight text-neutral-800 dark:text-white font-semibold">
            {displayRate}
          </span>
        </div>
      </div>
      <button
        onClick={() => setIsUsdtFirst(!isUsdtFirst)}
        className={`flex size-7 items-center justify-center rounded-lg border ${activeBorderClass} bg-neutral-50 dark:bg-[#242424] transition-all hover:bg-neutral-100 dark:hover:bg-[#2A2A2A] active:scale-95`}
      >
        <HugeiconsIcon icon={ArrowUpDownIcon} size={14} strokeWidth={2.5} />
      </button>
    </div>
  )
}

export function HeaderActions() {
  const { data: session, status } = useSession()
  const isLoading = status === "loading"
  const user = session?.user

  const router = useRouter()
  console.log({ user, status })

  return (
    <div className="flex items-center gap-4">
      <ExchangeRatePill />

      <div className="h-6 w-px bg-border" />

      <button className="flex size-9 items-center justify-center rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#1A1A1A] text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 transition-all hover:bg-neutral-50 dark:hover:bg-[#242424] active:scale-95">
        <HugeiconsIcon icon={Notification01Icon} size={20} strokeWidth={1.5} />
      </button>

      <div className="flex items-center gap-3 pl-1">
        <div className="flex flex-col items-end gap-1">
          {isLoading ? (
            <>
              <Skeleton className="h-3 w-24 bg-muted" />
              <Skeleton className="h-2.5 w-12 bg-muted/60" />
            </>
          ) : (
            <>
              <span className="text-[13px] leading-none font-bold text-neutral-800 dark:text-[#ededed]">
                {user?.email || "Unknown User"}
              </span>
              <span className="text-[11px] leading-none font-semibold text-muted-foreground capitalize">
                {(user as any)?.role || "User"}
              </span>
            </>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors outline-none">
              <HugeiconsIcon icon={ChevronDown} size={16} strokeWidth={2.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                toast.promise(signOut({ callbackUrl: "/signin" }), {
                  loading: "Signing out...",
                  success: "Signed out successfully!",
                  error: "Failed to sign out!",
                })
              }
              className="flex cursor-pointer items-center focus:bg-red-500/10"
            >
              <HugeiconsIcon
                icon={Logout01Icon}
                size={16}
                strokeWidth={2}
                className="mr-2"
              />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
