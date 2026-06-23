"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"

interface BankDetails {
  bankName: string
  accountName: string
  accountNumber: string
}

interface BankDetailsModalProps {
  children: React.ReactNode
  bankDetails: BankDetails
}

export function BankDetailsModal({ children, bankDetails }: BankDetailsModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[393px] p-0 border-border dark:border-[#1e1e1e] bg-background dark:bg-[#121212] gap-0">
        <DialogHeader className="border-b border-border dark:border-[#1e1e1e] p-[16px] pb-[16px]">
          <DialogTitle className="text-[16px] leading-normal font-medium text-foreground dark:text-white">
            Bank Account Details
          </DialogTitle>
          <DialogDescription className="text-[14px] leading-normal text-muted-foreground dark:text-[#848484] font-normal">
            Review linked bank account details.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-[16px] w-full">
          <div className="relative overflow-hidden w-full flex flex-col gap-2 items-start justify-center p-4 rounded-lg border border-border dark:border-white/10 bg-muted/40 dark:bg-white/5 backdrop-blur-md shadow-lg shrink-0">
            {/* Pattern Overlay (placeholder for SVG pattern) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle at center, white 1px, transparent 1px)", backgroundSize: "4px 4px" }} />
            
            <div className="relative z-10 w-full flex flex-col gap-1 items-start">
              <p className="text-[14px] text-muted-foreground dark:text-[#848484] font-normal w-full">
                Bank Name
              </p>
              <p className="text-[14px] font-bold text-foreground dark:text-white w-full">
                {bankDetails.bankName}
              </p>
            </div>
            <div className="relative z-10 w-full flex flex-col gap-1 items-start mt-1">
              <p className="text-[14px] text-muted-foreground dark:text-[#848484] font-normal w-full">
                Account Name
              </p>
              <p className="text-[14px] font-bold text-foreground dark:text-white w-full">
                {bankDetails.accountName}
              </p>
            </div>
            <div className="relative z-10 w-full flex flex-col gap-1 items-start mt-1">
              <p className="text-[14px] text-muted-foreground dark:text-[#848484] font-normal w-full">
                Account Number
              </p>
              <p className="text-[14px] font-bold text-foreground dark:text-white w-full tracking-wide">
                {bankDetails.accountNumber}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
