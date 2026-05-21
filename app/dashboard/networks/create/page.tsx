"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"

export default function CreateNetworkPage() {
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
            <Button variant="outline">Save Network</Button>
          </div>
        </div>

        <form className="space-y-8">
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
                <Label className="text-sm text-muted-foreground dark:text-[#a0a0a0]">
                  Network Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Ethereum Mainnet"
                  className="h-10 border-border dark:border-[#282828] bg-background dark:bg-[#121212] text-foreground dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground dark:text-[#a0a0a0]">
                  Symbol <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. ETH"
                  className="h-10 border-border dark:border-[#282828] bg-background dark:bg-[#121212] text-foreground dark:text-white uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground dark:text-[#a0a0a0]">Network Type</Label>
                <Input
                  placeholder="e.g. Mainnet, Testnet"
                  className="h-10 border-border dark:border-[#282828] bg-background dark:bg-[#121212] text-foreground dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground dark:text-[#a0a0a0]">
                  RPC URL <span className="text-red-500">*</span>
                </Label>
                <Input
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
                <Label className="text-sm text-muted-foreground dark:text-[#a0a0a0]">
                  USDT Contract Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="0x..."
                  className="h-10 border-border dark:border-[#282828] bg-background dark:bg-[#121212] font-mono text-sm text-foreground dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground dark:text-[#a0a0a0]">USDT Decimals</Label>
                <Input
                  type="number"
                  defaultValue={6}
                  className="h-10 border-border dark:border-[#282828] bg-background dark:bg-[#121212] text-foreground dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground dark:text-[#a0a0a0]">
                  Gas Fee Token Name
                </Label>
                <Input
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

            <div className="flex items-center justify-between rounded-xl border border-border dark:border-[#282828] bg-card dark:bg-[#121212] p-5">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-foreground dark:text-[#ededed]">
                  Enable Network
                </Label>
                <p className="text-xs text-muted-foreground dark:text-[#888888]">
                  Toggle this to instantly activate or deactivate the network
                  across the platform.
                </p>
              </div>
              <Switch id="active" defaultChecked />
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
