"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { createNetworkAction } from "./actions"

export default function CreateNetworkPage() {
  const router = useRouter()
  const [isActive, setIsActive] = useState(true)
  const [state, formAction, isPending] = useActionState(
    createNetworkAction,
    null
  )

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message)
      router.push("/dashboard/networks")
    } else if (state?.success === false) {
      toast.error(state.message)
    }
  }, [state, router])

  return (
    <div className="flex flex-1 flex-col p-8 text-foreground dark:text-[#ededed] lg:p-10">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Create Network
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure a new blockchain network to be used across the platform.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              asChild
              variant="destructive"
              className="h-9 border border-border dark:border-[#282828] bg-transparent text-sm hover:bg-muted/50 dark:hover:bg-[#1a1a1a] text-foreground dark:text-white"
            >
              <Link href="/dashboard/networks">Cancel</Link>
            </Button>
            <Button
              type="submit"
              form="create-network-form"
              disabled={isPending}
              variant="outline"
            >
              {isPending ? "Saving..." : "Save Network"}
            </Button>
          </div>
        </div>

        <form id="create-network-form" action={formAction} className="space-y-8">
          {/* Section 1 */}
          <div className="space-y-6">
            <div className="border-b border-border dark:border-[#282828] pb-3">
              <h2 className="text-base font-medium">Network Details</h2>
              <p className="mt-1 text-xs text-muted-foreground dark:text-[#888888]">
                Basic information about the blockchain network.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm text-muted-foreground dark:text-[#a0a0a0]">
                  Network Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. Ethereum Mainnet"
                  className="h-10 border-border dark:border-[#282828] bg-background dark:bg-[#121212] text-foreground dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="symbol" className="text-sm text-muted-foreground dark:text-[#a0a0a0]">
                  Symbol <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="symbol"
                  name="symbol"
                  required
                  placeholder="e.g. ETH"
                  className="h-10 border-border dark:border-[#282828] bg-background dark:bg-[#121212] text-foreground dark:text-white uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm text-muted-foreground dark:text-[#a0a0a0]">
                  Network Type <span className="text-red-500">*</span>
                </Label>
                <Select name="type" defaultValue="mainnet" required>
                  <SelectTrigger id="type" className="h-10 border-border dark:border-[#282828] bg-background dark:bg-[#121212] text-foreground dark:text-white">
                    <SelectValue placeholder="Select Network Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-background dark:bg-[#121212] border-border dark:border-[#1e1e1e] text-foreground dark:text-white">
                    <SelectItem value="mainnet">Mainnet</SelectItem>
                    <SelectItem value="testnet">Testnet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rpcUrl" className="text-sm text-muted-foreground dark:text-[#a0a0a0]">
                  RPC URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="rpcUrl"
                  name="rpcUrl"
                  type="url"
                  required
                  placeholder="https://..."
                  className="h-10 border-border dark:border-[#282828] bg-background dark:bg-[#121212] font-mono text-sm text-foreground dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-6 pt-4">
            <div className="border-b border-border dark:border-[#282828] pb-3">
              <h2 className="text-base font-medium">Smart Contracts & Fees</h2>
              <p className="mt-1 text-xs text-muted-foreground dark:text-[#888888]">
                Configure the USDT contract and default gas fee token.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="contractAddress" className="text-sm text-muted-foreground dark:text-[#a0a0a0]">
                  USDT Contract Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contractAddress"
                  name="contractAddress"
                  required
                  placeholder="0x..."
                  className="h-10 border-border dark:border-[#282828] bg-background dark:bg-[#121212] font-mono text-sm text-foreground dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currencyDecimals" className="text-sm text-muted-foreground dark:text-[#a0a0a0]">
                  USDT Decimals <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="currencyDecimals"
                  name="currencyDecimals"
                  type="number"
                  defaultValue={6}
                  required
                  className="h-10 border-border dark:border-[#282828] bg-background dark:bg-[#121212] text-foreground dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feeToken" className="text-sm text-muted-foreground dark:text-[#a0a0a0]">
                  Gas Fee Token Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="feeToken"
                  name="feeToken"
                  required
                  placeholder="e.g. ETH, TRX"
                  className="h-10 border-border dark:border-[#282828] bg-background dark:bg-[#121212] text-foreground dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-6 pt-4 pb-10">
            <div className="border-b border-border dark:border-[#282828] pb-3">
              <h2 className="text-base font-medium">Activation</h2>
            </div>

            <div
              onClick={() => setIsActive(!isActive)}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-border dark:border-[#282828] bg-card dark:bg-[#121212] p-5 hover:bg-muted/30 transition-colors"
            >
              <div className="space-y-1">
                <Label
                  htmlFor="active"
                  className="cursor-pointer text-sm font-medium text-foreground dark:text-[#ededed]"
                >
                  Enable Network
                </Label>
                <p className="text-xs text-muted-foreground dark:text-[#888888]">
                  Toggle this to instantly activate or deactivate the network
                  across the platform.
                </p>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <Switch
                  id="active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>
            <input type="hidden" name="isActive" value={isActive ? "true" : "false"} />
          </div>
        </form>
      </div>
    </div>
  )
}
