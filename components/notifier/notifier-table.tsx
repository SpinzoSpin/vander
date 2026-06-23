"use client"

import { useState, useTransition } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  TelegramIcon,
  Shield01Icon,
  Delete02Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons"
import { addNotifierChatIdAction, deleteNotifierChatIdAction } from "@/app/dashboard/notifier/actions"

export interface NotifierChat {
  id: string
  chatId: string
  source: "Static (Env)" | "Dynamic (Dashboard)"
  status: "Active"
}

interface NotifierTableProps {
  data: NotifierChat[]
}

// ─── Add Chat ID Dialog ───────────────────────────────────────────────────────

export function AddChatDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg("")
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await addNotifierChatIdAction(null, formData)
      if (res.success) {
        toast.success(res.message)
        setOpen(false)
      } else {
        setErrorMsg(res.message || "Failed to add Chat ID")
        toast.error(res.message || "Failed to add Chat ID")
      }
    })
  }

  return (
    <>
      <Button variant="outline" className="flex items-center gap-1.5" onClick={() => setOpen(true)}>
        Create New
        <HugeiconsIcon icon={Add01Icon} size={14} />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-border dark:border-[#1e1e1e] bg-background dark:bg-[#121212] text-foreground dark:text-white p-6">
          <DialogHeader className="p-0 border-b-0">
            <DialogTitle className="text-foreground dark:text-white flex items-center gap-2">
              <HugeiconsIcon icon={TelegramIcon} className="text-primary" size={18} />
              Add Allowed Chat ID
            </DialogTitle>
            <DialogDescription className="text-muted-foreground dark:text-[#848484] text-xs pt-1.5">
              Enter a Telegram Chat ID or User ID to authorize it to receive notifications and execute settlement updates.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="chatId" className="text-xs font-semibold text-foreground dark:text-[#ededed]">
                Telegram Chat ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="chatId"
                name="chatId"
                type="text"
                placeholder="e.g. 6888525794 or -100123456789"
                required
                className="border-border dark:border-[#282828] bg-transparent"
              />
              <p className="text-[10px] text-muted-foreground dark:text-[#4e4e4e]">
                Group IDs typically start with a minus sign (<code>-</code>). You can fetch IDs using bots like <code>@userinfobot</code>.
              </p>
            </div>

            {errorMsg && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-center gap-2">
                <HugeiconsIcon icon={Alert02Icon} size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-foreground dark:text-[#ededed] hover:bg-muted dark:hover:bg-[#1e1e1e]"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Adding..." : "Add Chat ID"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Delete Chat ID Dialog ────────────────────────────────────────────────────

function DeleteChatDialog({ chatId }: { chatId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteNotifierChatIdAction(chatId)
      if (res.success) {
        toast.success(res.message)
        setOpen(false)
      } else {
        toast.error(res.message || "Failed to delete Chat ID")
      }
    })
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:bg-destructive/10"
        onClick={() => setOpen(true)}
      >
        <HugeiconsIcon icon={Delete02Icon} size={16} />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-border dark:border-[#1e1e1e] bg-background dark:bg-[#121212] text-foreground dark:text-white p-6">
          <div className="space-y-6">
            <DialogHeader className="p-0 border-b-0">
              <DialogTitle className="text-foreground dark:text-white flex items-center gap-2">
                <HugeiconsIcon icon={Alert02Icon} className="text-destructive" size={18} />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="text-muted-foreground dark:text-[#848484] text-xs pt-1.5">
                Are you sure you want to delete Telegram Chat ID <code className="text-foreground dark:text-white font-mono">{chatId}</code>? 
                This chat will immediately stop receiving notifications and will be blocked from managing transaction actions.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="p-0 border-t-0 gap-2">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-foreground dark:text-[#ededed] hover:bg-muted dark:hover:bg-[#1e1e1e]"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={handleDelete}
              >
                {isPending ? "Deleting..." : "Delete ID"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Columns Definition ───────────────────────────────────────────────────────

const columns: ColumnDef<NotifierChat>[] = [
  {
    accessorKey: "chatId",
    header: "TELEGRAM CHAT ID",
    cell: ({ row }) => (
      <span className="text-xs font-mono font-medium text-foreground dark:text-[#ededed]">{row.getValue("chatId")}</span>
    ),
  },
  {
    accessorKey: "source",
    header: "SOURCE TYPE",
    cell: ({ row }) => {
      const source = row.getValue("source") as string
      const isStatic = source.includes("Static")
      return (
        <Badge variant={isStatic ? "default" : "secondary"} className="flex w-fit items-center gap-1.5 capitalize">
          <HugeiconsIcon icon={isStatic ? Shield01Icon : TelegramIcon} size={14} />
          {isStatic ? "Environment (Static)" : "Dashboard (Dynamic)"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "status",
    header: "STATUS",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-[#83b047] border-[#83b047]/20 bg-[#83b047]/10">
        Active
      </Badge>
    ),
  },
  {
    id: "action",
    header: "ACTION",
    cell: ({ row }) => {
      const isStatic = row.original.source.includes("Static")
      if (isStatic) {
        return <span className="text-[10px] text-muted-foreground dark:text-[#4e4e4e] italic">Statically Locked</span>
      }
      return (
        <div className="flex items-center gap-1">
          <DeleteChatDialog chatId={row.original.chatId} />
        </div>
      )
    },
  },
]

export function NotifierTable({ data }: NotifierTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="No Telegram chat IDs configured"
      pageSize={10}
    />
  )
}
