import type { Metadata, Viewport } from 'next'
import { Inter, Open_Sans } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const openSans = Open_Sans({ 
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'BlasRodríguez - Administración de Flota de Taxis y Colectivos',
  description: 'Sistema integral para administrar taxis y colectivos. Controla mantenimientos, asignaciones y operación diaria de tu flota vehicular.',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${openSans.variable}`} suppressHydrationWarning>
      <body className="font-body bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased overflow-x-hidden">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
