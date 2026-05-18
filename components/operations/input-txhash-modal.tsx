"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function UploadTxHashModal() {
  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button variant="outline">Upload tx</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Upload Proof</DialogTitle>
            <DialogDescription>
              Please provide the crypto transaction hash to continue the
              exchange.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="px-4 py-6">
            <Field>
              <Label htmlFor="tx-hash">Transaction Hash</Label>
              <Input id="name-1" name="name" defaultValue="Pedro Duarte" />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
