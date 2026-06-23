"use client"

import { useState, useTransition } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Shield01Icon,
  UserIcon,
  Key01Icon,
  ViewIcon,
  ViewOffIcon,
  Copy01Icon,
  CheckmarkCircle01Icon,
  PencilEdit01Icon,
  Delete02Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons"
import { updateUserAction, deleteUserAction } from "@/actions/users"

export interface User {
  id: string
  email: string
  role: string
  apiKey?: string
  updatedAt: string
  createdAt: string
}

interface UsersTableProps {
  data: User[]
}

// ─── API Key Reveal Cell ──────────────────────────────────────────────────────
// Renders a button in the table that opens a dialog/modal to reveal the API key.

function ApiKeyCell({ apiKey }: { apiKey?: string }) {
  const [open, setOpen] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleOpen = () => {
    setOpen(true)
    setRevealed(false)
    setCopied(false)
  }

  const handleCopy = async () => {
    if (!apiKey) return
    await navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!apiKey) {
    return (
      <span className="text-xs text-[#4e4e4e] italic">No key</span>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 px-2 text-xs text-[#848484] hover:text-[#ededed] dark:hover:text-[#ededed] transition-colors"
        onClick={handleOpen}
      >
        <HugeiconsIcon icon={Key01Icon} size={14} />
        View Key
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-border dark:border-[#1e1e1e] bg-background dark:bg-[#121212] text-foreground dark:text-white p-6">
          <div className="space-y-6">
            <DialogHeader className="p-0 border-b-0">
              <DialogTitle className="text-foreground dark:text-white flex items-center gap-2">
                <HugeiconsIcon icon={Key01Icon} className="text-primary" size={18} />
                API Key Privacy Reveal
              </DialogTitle>
              <DialogDescription className="text-muted-foreground dark:text-[#848484] text-xs">
                Ensure you are not sharing your screen before revealing this API key.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative w-full">
                <input
                  type="text"
                  readOnly
                  value={apiKey}
                  className={`w-full font-mono text-sm px-3 py-2 bg-muted/40 dark:bg-[#0a0a0a] border border-border dark:border-[#282828] rounded-md text-center transition-all ${
                    revealed ? "" : "blur-md select-none"
                  }`}
                />
              </div>
              <div className="flex gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-border dark:border-[#282828] hover:bg-muted/50 dark:hover:bg-[#1a1a1a]"
                  onClick={() => setRevealed(!revealed)}
                >
                  <HugeiconsIcon icon={revealed ? ViewOffIcon : ViewIcon} className="mr-2" size={16} />
                  {revealed ? "Hide Key" : "Reveal Key"}
                </Button>
                <Button
                  type="button"
                  variant="default"
                  disabled={!revealed}
                  className="flex-1"
                  onClick={handleCopy}
                >
                  <HugeiconsIcon icon={copied ? CheckmarkCircle01Icon : Copy01Icon} className="mr-2" size={16} />
                  {copied ? "Copied" : "Copy Key"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Edit User Dialog ─────────────────────────────────────────────────────────

function EditUserDialog({ user }: { user: User }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.append("userId", user.id)

    startTransition(async () => {
      const res = await updateUserAction(formData)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("User updated successfully")
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <HugeiconsIcon icon={PencilEdit01Icon} size={16} />
      </Button>
      <DialogContent className="max-w-md border-border dark:border-[#1e1e1e] bg-background dark:bg-[#121212] text-foreground dark:text-white p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader className="p-0 border-b-0">
            <DialogTitle className="text-foreground dark:text-white flex items-center gap-2">
              <HugeiconsIcon icon={PencilEdit01Icon} className="text-primary" size={18} />
              Edit User Data
            </DialogTitle>
            <DialogDescription className="text-muted-foreground dark:text-[#848484] text-xs">
              Update email, role, or optionally set a new password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground dark:text-[#ededed] text-xs font-semibold">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                required
                className="bg-muted/40 dark:bg-[#0a0a0a] border-border dark:border-[#282828] text-foreground dark:text-[#ededed] focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-foreground dark:text-[#ededed] text-xs font-semibold">Role</Label>
              <Select name="role" defaultValue={user.role}>
                <SelectTrigger className="bg-muted/40 dark:bg-[#0a0a0a] border-border dark:border-[#282828] text-foreground dark:text-[#ededed]">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-background dark:bg-[#121212] border-border dark:border-[#1e1e1e] text-foreground dark:text-white">
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground dark:text-[#ededed] text-xs font-semibold">New Password (Optional)</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Leave blank to keep current"
                className="bg-muted/40 dark:bg-[#0a0a0a] border-border dark:border-[#282828] text-foreground dark:text-[#ededed] focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <DialogFooter className="p-0 border-t-0 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-border dark:border-[#282828]"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete User Dialog ───────────────────────────────────────────────────────

function DeleteUserDialog({ user }: { user: User }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteUserAction(user.id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("User deleted successfully")
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-red-500"
        onClick={() => setOpen(true)}
      >
        <HugeiconsIcon icon={Delete02Icon} size={16} />
      </Button>
      <DialogContent className="max-w-md border-border dark:border-[#1e1e1e] bg-background dark:bg-[#121212] text-foreground dark:text-white p-6">
        <div className="space-y-6">
          <DialogHeader className="p-0 border-b-0">
            <DialogTitle className="text-foreground dark:text-white flex items-center gap-2">
              <HugeiconsIcon icon={Alert02Icon} className="text-red-500" size={18} />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-muted-foreground dark:text-[#848484] text-xs">
              Are you sure you want to delete user <span className="font-semibold text-foreground dark:text-white">{user.email}</span>? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="p-0 border-t-0 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-border dark:border-[#282828]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Columns Definition ───────────────────────────────────────────────────────

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "email",
    header: "EMAIL",
    cell: ({ row }) => (
      <span className="text-xs font-medium text-foreground dark:text-[#ededed]">{row.getValue("email")}</span>
    ),
  },
  {
    accessorKey: "role",
    header: "ROLE",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      const isAdmin = role.toLowerCase() === "admin"
      return (
        <Badge variant={isAdmin ? "default" : "secondary"} className="flex w-fit items-center gap-1.5 capitalize">
          <HugeiconsIcon icon={isAdmin ? Shield01Icon : UserIcon} size={14} />
          {role.toLowerCase()}
        </Badge>
      )
    },
  },
  {
    accessorKey: "apiKey",
    header: "API KEY",
    cell: ({ row }) => <ApiKeyCell apiKey={row.original.apiKey} />,
  },
  {
    accessorKey: "updatedAt",
    header: "UPDATED AT",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground dark:text-[#848484]">{row.getValue("updatedAt")}</span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "CREATED AT",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground dark:text-[#848484]">{row.getValue("createdAt")}</span>
    ),
  },
  {
    id: "action",
    header: "ACTION",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <EditUserDialog user={row.original} />
        <DeleteUserDialog user={row.original} />
      </div>
    ),
  },
]

export function UsersTable({ data }: UsersTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="No users in this period"
      pageSize={10}
    />
  )
}