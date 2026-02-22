import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
})

export const metadata: Metadata = {
  title: 'Taskweave',
  description: 'A holistic productivity and wellness companion that aligns your tasks with your energy levels.',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${manrope.variable}`}>
      <body className={`h-full font-sans bg-background text-foreground selection:bg-primary/30`}>
          {children}
      </body>
    </html>
  )
}
