import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SalesCast — Sales Forecasting Dashboard',
  description: 'Interactive sales forecasting portfolio project built with Next.js.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
