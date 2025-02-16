import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ProvideAuth } from "@/hooks/useAuth";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400"] })

export const metadata = {
  title: "Lumora - AI-Powered Collaboration Hub",
  description: "Transform your meetings and chats into actionable workflows with Lumora",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <ProvideAuth>
        <body className={`${inter.className} bg-gray-900 text-gray-100 font-light`}>
          <main className="min-h-screen">{children}</main>
        </body>
      </ProvideAuth>
    </html>
  )
}

