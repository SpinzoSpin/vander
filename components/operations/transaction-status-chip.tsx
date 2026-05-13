import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle01Icon,
  Loading03Icon,
  Clock04Icon,
  PackageDeliveredIcon,
  Alert02Icon,
  ArrowDownRightIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"

type TransactionStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "complete"
  | "fiat_arrival"
  | "crypto_arrival"

interface StatusConfig {
  label: string
  color: string      // text + border tint
  bgColor: string    // chip background
  icon: typeof CheckmarkCircle01Icon
}

const STATUS_MAP: Record<TransactionStatus, StatusConfig> = {
  pending: {
    label: "Pending",
    color: "text-[#e38752]",
    bgColor: "bg-[#e38752]/10 border-[#e38752]/20",
    icon: Clock04Icon,
  },
  confirmed: {
    label: "Confirmed",
    color: "text-[#5b9eff]",
    bgColor: "bg-[#5b9eff]/10 border-[#5b9eff]/20",
    icon: CheckmarkCircle01Icon,
  },
  processing: {
    label: "Processing",
    color: "text-[#c49bff]",
    bgColor: "bg-[#c49bff]/10 border-[#c49bff]/20",
    icon: Loading03Icon,
  },
  complete: {
    label: "Complete",
    color: "text-[#83b047]",
    bgColor: "bg-[#83b047]/10 border-[#83b047]/20",
    icon: CheckmarkCircle01Icon,
  },
  fiat_arrival: {
    label: "Fiat Arrival",
    color: "text-[#4ecdc4]",
    bgColor: "bg-[#4ecdc4]/10 border-[#4ecdc4]/20",
    icon: PackageDeliveredIcon,
  },
  crypto_arrival: {
    label: "Crypto Arrival",
    color: "text-[#f7d060]",
    bgColor: "bg-[#f7d060]/10 border-[#f7d060]/20",
    icon: ArrowDownRightIcon,
  },
}

// Fallback for any unknown status
const FALLBACK_CONFIG: StatusConfig = {
  label: "Unknown",
  color: "text-[#848484]",
  bgColor: "bg-[#848484]/10 border-[#848484]/20",
  icon: Alert02Icon,
}

interface TransactionStatusChipProps {
  status: string
  className?: string
}

export function TransactionStatusChip({ status, className }: TransactionStatusChipProps) {
  const config = STATUS_MAP[status as TransactionStatus] || FALLBACK_CONFIG

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        config.bgColor,
        config.color,
        className
      )}
    >
      <HugeiconsIcon
        icon={config.icon}
        strokeWidth={2}
        className={cn("size-3.5", status === "processing" && "animate-spin")}
      />
      {config.label}
    </span>
  )
}
