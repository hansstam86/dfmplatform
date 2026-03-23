import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DFM Platform',
  description: 'AI-powered DFM review — FMEA, Project Charter & Build Timeline from your PRD and BOM.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
