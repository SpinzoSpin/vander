import type { Metadata, Viewport } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryProvider } from "@/components/providers/query-provider"
import { ProgressBarProvider } from "@/components/providers/progress-bar-provider"
import { cn } from "@/lib/utils"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
import { Manrope } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: {
    default: "SpinzoPay",
    template: "%s | SpinzoPay",
  },
  description:
    "SpinzoPay — Secure payment exchange and treasury management platform for seamless fiat-to-crypto and crypto-to-fiat operations.",
  keywords: [
    "SpinzoPay",
    "payment exchange",
    "crypto",
    "fiat",
    "treasury",
    "exchange rates",
    "payment gateway",
  ],
  authors: [{ name: "SpinzoPay" }],
  creator: "SpinzoPay",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SpinzoPay",
    title: "SpinzoPay",
    description:
      "Secure payment exchange and treasury management platform for seamless fiat-to-crypto and crypto-to-fiat operations.",
  },
  twitter: {
    card: "summary",
    title: "SpinzoPay",
    description:
      "Secure payment exchange and treasury management platform.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
  width: "device-width",
  initialScale: 1,
}


const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", "font-sans", manrope.className)}
    >
      <body>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <SessionProvider refetchOnWindowFocus>
                <ProgressBarProvider>{children}</ProgressBarProvider>
              </SessionProvider>
            </TooltipProvider>
          </ThemeProvider>
          <Toaster position="top-center" />
        </QueryProvider>
      </body>
    </html>
  )
}
