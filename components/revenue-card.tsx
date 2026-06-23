"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface RevenueCardProps {
  title?: string
  amount?: string
  percentageChange?: string
  isPositive?: boolean
  description?: string
  className?: string
  withEndLabel?: boolean
  withUSDTIcon?: boolean
}

export function RevenueCard({
  title = "TOTAL REVENUE",
  amount = "0.00",
  percentageChange = "3.27%",
  isPositive = true,
  description,
  className,
  withEndLabel = true,
  withUSDTIcon = true,
}: RevenueCardProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col justify-between overflow-hidden rounded-lg border p-3",
        // Match Figma in dark mode, standard card in light mode
        "border-border dark:border-[#2e2e2e] bg-card dark:bg-[#181818]",
        className
      )}
    >
      {/* Header */}
      <div className="flex w-full items-center justify-between">
        <p className="text-base leading-normal font-semibold tracking-wide whitespace-nowrap text-foreground dark:text-[#ededed]">
          {title}
        </p>

        {/* Percentage change badge with tooltip */}
        {withEndLabel && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex cursor-help items-center gap-1 rounded border px-2 py-1.5 text-xs font-medium whitespace-nowrap",
                    isPositive
                      ? "border-green-200 bg-green-50/50 text-green-600 dark:border-[#090f01] dark:bg-[rgba(131,176,71,0.04)] dark:text-[#83b047]"
                      : "border-orange-200 bg-orange-50/50 text-orange-600 dark:border-[#3e1c1c] dark:bg-[rgba(255,80,80,0.04)] dark:text-[#E38752]"
                  )}
                >
                  {/* Up/Down arrow icon */}
                  <span className="relative block size-3 shrink-0">
                    <Image
                      alt="arrow_up"
                      src={isPositive ? "/trending_up.svg" : "/trending_down.svg"}
                      width={16}
                      height={16}
                    />
                  </span>
                  <span>{percentageChange}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={6}
                className="border border-border bg-popover text-popover-foreground dark:border-[#2e2e2e] dark:bg-[#1e1e1e] dark:text-[#ededed]"
                style={{ "--tooltip-bg": "var(--popover)" } as React.CSSProperties}
              >
                {percentageChange === "100.00%"
                  ? "No data from last month"
                  : "Compared to last 30 days"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Details */}
      <div className="mt-6 flex w-full flex-col gap-3 pr-2">
        {/* Amount row */}
        <div className="flex w-full items-center justify-between">
          <p className="text-[28px] leading-normal font-semibold whitespace-nowrap text-foreground dark:text-[#ededed]">
            {amount}
          </p>
          {/* USDT icon */}
          {withUSDTIcon && (
            <div className="relative size-8 shrink-0 overflow-hidden rounded-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="USDT"
                className="absolute inset-0 block size-full"
                src={"/icon_usdt.png"}
              />
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm leading-normal font-medium whitespace-nowrap text-muted-foreground dark:text-[#4e4e4e]">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
