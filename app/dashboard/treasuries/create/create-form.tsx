"use client"

import { useActionState, useEffect } from "react"
import { createTreasuryAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function CreateTreasuryForm({ networks }: { networks: any[] }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    createTreasuryAction,
    null
  )

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message)
      router.push("/dashboard/treasuries")
    } else if (state?.success === false) {
      toast.error(state.message)
    }
  }, [state, router])

  return (
    <form action={formAction} className="flex max-w-[600px] flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-[#ededed]">
          Wallet Name
        </Label>
        <Input
          name="walletName"
          required
          className="border-[#282828] bg-[#121212] text-[#ededed]"
          placeholder="e.g. Main Operations"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-[#ededed]">
          Wallet Address
        </Label>
        <Input
          name="walletAddress"
          required
          className="border-[#282828] bg-[#121212] text-[#ededed]"
          placeholder="0x..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-[#ededed]">Network</Label>
        <Select name="networkId" required>
          <SelectTrigger className="border-[#282828] bg-[#121212] text-[#ededed]">
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent>
            {networks.map((n) => (
              <SelectItem key={n.id} value={n.id.toString()}>
                {n.name} ({n.symbol})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-[#ededed]">
          Initial Balance
        </Label>
        <Input
          name="currentBalance"
          type="number"
          step="any"
          defaultValue="0"
          className="border-[#282828] bg-[#121212] text-[#ededed]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-[#ededed]">
          Private Key (Optional)
        </Label>
        <Input
          name="privateKey"
          type="password"
          className="border-[#282828] bg-[#121212] text-[#ededed]"
        />
      </div>

      <Button
        disabled={isPending}
        type="submit"
        variant="outline"
        className="mt-4 w-full"
      >
        {isPending ? "Creating..." : "Create Treasury"}
      </Button>
    </form>
  )
}
