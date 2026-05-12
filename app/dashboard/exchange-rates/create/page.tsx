"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export default function CreateExchangeRatePage() {
  return (
    <div className="flex flex-1 flex-col p-8 text-[#ededed]">
      {/* Sub Header */}
      <div className="mb-8 flex items-center justify-between border-b border-[#282828] pb-4">
        <div className="flex gap-4 text-xs text-[#4e4e4e]">
          <span>Last Modified: April 17th 2026, 5:15 PM</span>
          <span>Created: April 15th 2026, 2:40 PM</span>
        </div>
        <div className="flex items-center gap-2">
          <Button className="h-8 border border-[#282828] bg-[#1e1e1e] px-4 text-[#ededed] hover:bg-[#2a2a2a]">
            Save
          </Button>
          <Button
            variant="outline"
            className="flex h-8 w-8 items-center justify-center border-[#282828] bg-[#1e1e1e] p-0"
          >
            &#8942;
          </Button>
        </div>
      </div>

      <div className="flex max-w-[1000px] flex-col gap-8">
        {/* Currency Pair */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-[#ededed]">
            Currency Pair <span className="text-red-500">*</span>
          </Label>
          <Input
            disabled
            value="USDT/PHP"
            className="w-full border-[#282828] bg-[#1e1e1e] text-[#4e4e4e]"
          />
          <p className="text-xs text-[#4e4e4e]">
            Fixed pair for this exchange rate configuration.
          </p>
        </div>

        {/* USDT -> PHP Pricing */}
        <div className="relative flex flex-col gap-6 rounded-lg border border-[#282828] bg-[#121212] p-6">
          <div className="absolute -top-3 left-6 flex items-center gap-2 bg-[#121212] px-2">
            <span className="text-xs font-semibold tracking-wider text-[#4e4e4e]">
              USDT → PHP PRICING
            </span>
            <span className="rounded bg-[#003b5c] px-2 py-0.5 text-[10px] font-bold text-[#4da6ff]">
              REF: 60.04
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm text-[#ededed]">
                Reference Rate (1 USDT = ? PHP)
              </Label>
              <Input
                defaultValue="60.04"
                className="border-[#282828] bg-[#121212]"
              />
              <p className="text-xs text-[#4e4e4e]">
                Original market/reference for this ramp
              </p>
            </div>

            <div className="mt-8 flex items-center justify-center text-[#4e4e4e]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#282828] bg-[#1e1e1e]">
                <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm text-[#ededed]">
                Rate (1 USDT = ? PHP)
              </Label>
              <Input
                defaultValue="59.9"
                className="border-[#282828] bg-[#121212]"
              />
              <p className="text-xs text-[#4e4e4e]">
                PHP received per USDT sold
              </p>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm text-[#ededed]">Markup %</Label>
              <Input
                defaultValue="0.23"
                className="border-[#282828] bg-[#121212]"
              />
              <div className="mt-1 flex flex-col gap-1">
                <p className="text-xs text-[#4e4e4e]">
                  Set the markup percentage to control your profit margin on
                  this rate.
                </p>
                <p className="text-xs text-[#4e4e4e]">
                  At 0.23% markup: final rate is 59.9 (market/reference: 60.04).
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center text-[#4e4e4e]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#282828] bg-[#1e1e1e]">
                <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-[#4e4e4e]">
                  Profit / Spread (PHP)
                </Label>
                <div className="flex h-10 items-center rounded-md border border-[#282828] bg-[#121212] px-3">
                  <span className="font-medium text-[#ededed]">0.14</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-[#4e4e4e]">Spread (%)</Label>
                <div className="flex h-10 items-center rounded-md border border-[#282828] bg-[#121212] px-3">
                  <span className="font-medium text-[#ededed]">0.23%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PHP -> USDT Pricing */}
        <div className="relative mt-2 flex flex-col gap-6 rounded-lg border border-[#282828] bg-[#121212] p-6">
          <div className="absolute -top-3 left-6 flex items-center gap-2 bg-[#121212] px-2">
            <span className="text-xs font-semibold tracking-wider text-[#4e4e4e]">
              PHP → USDT PRICING
            </span>
            <span className="rounded bg-[#003b5c] px-2 py-0.5 text-[10px] font-bold text-[#4da6ff]">
              REF: 0.01669
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm text-[#ededed]">
                Reference Rate (1 PHP = ? USDT)
              </Label>
              <Input
                defaultValue="0.01669"
                className="border-[#282828] bg-[#121212]"
              />
              <p className="text-xs text-[#4e4e4e]">
                Original market/reference for this ramp
              </p>
            </div>

            <div className="mt-8 flex items-center justify-center text-[#4e4e4e]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#282828] bg-[#1e1e1e]">
                <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm text-[#ededed]">
                Rate (1 PHP = ? USDT)
              </Label>
              <Input
                defaultValue="0.016523"
                className="border-[#282828] bg-[#121212]"
              />
              <p className="text-xs text-[#4e4e4e]">
                USDT received per PHP spent
              </p>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm text-[#ededed]">Markup %</Label>
              <Input
                defaultValue="1"
                className="border-[#282828] bg-[#121212]"
              />
              <div className="mt-1 flex flex-col gap-1">
                <p className="text-xs text-[#4e4e4e]">
                  Set the markup percentage to control your profit margin on
                  this rate.
                </p>
                <p className="text-xs text-[#4e4e4e]">
                  At 1% markup: final rate is 0.016523 (market/reference:
                  0.01669).
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center text-[#4e4e4e]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#282828] bg-[#1e1e1e]">
                <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-[#4e4e4e]">
                  Profit / Spread (USDT)
                </Label>
                <div className="flex h-10 items-center rounded-md border border-[#282828] bg-[#121212] px-3">
                  <span className="font-medium text-[#ededed]">0.000167</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-[#4e4e4e]">Spread (%)</Label>
                <div className="flex h-10 items-center rounded-md border border-[#282828] bg-[#121212] px-3">
                  <span className="font-medium text-[#ededed]">1%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Toggle */}
        <div className="mt-2 flex items-center space-x-2 pb-8">
          <Checkbox
            id="active"
            className="border-[#282828] data-[state=checked]:border-[#83b047] data-[state=checked]:bg-[#83b047]"
          />
          <Label
            htmlFor="active"
            className="cursor-pointer text-sm font-medium text-[#ededed]"
          >
            Active
          </Label>
        </div>
      </div>
    </div>
  )
}
