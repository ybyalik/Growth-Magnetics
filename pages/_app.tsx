import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { AuthProvider } from '../lib/auth-context'
import { Syne, Plus_Jakarta_Sans } from 'next/font/google'

const syne = Syne({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  weight: ['400', '500', '600', '700', '800'],
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <main className={`${syne.variable} ${plusJakarta.variable}`}>
        <Component {...pageProps} />
      </main>
    </AuthProvider>
  )
}

export default MyApp
