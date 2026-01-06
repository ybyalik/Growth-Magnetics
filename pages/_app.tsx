import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { AuthProvider } from '../lib/auth-context'
import { Playfair_Display, Montserrat } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-heading',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <main className={`${playfair.variable} ${montserrat.variable}`}>
        <Component {...pageProps} />
      </main>
    </AuthProvider>
  )
}

export default MyApp
