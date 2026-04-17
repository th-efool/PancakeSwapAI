import type { Metadata } from 'next'
import Sidebar from '../components/Sidebar.tsx'
import './globals.css'


export const metadata: Metadata = {
  title: 'PancakeSwap AI Observability',
  description: 'Live pipeline monitor',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-white text-[#111111]">
        <div className="flex min-h-screen flex-col md:flex-row">
          <Sidebar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  )
}
