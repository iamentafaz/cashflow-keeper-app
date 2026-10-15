import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'KipCash',
  description: 'A focused personal finance workspace for accounts, transactions, currencies, receipts, and reconciliation.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
<html lang="en">
  <body>
    <Providers>{children}</Providers>
  </body>
</html>
  )
}
