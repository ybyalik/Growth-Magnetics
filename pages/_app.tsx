import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { AuthProvider } from '../lib/auth-context'
import { Bitter, Plus_Jakarta_Sans } from 'next/font/google'

const bitter = Bitter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-heading',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-body',
})

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <main className={`${bitter.variable} ${plusJakarta.variable}`}>
        <Component {...pageProps} />
      </main>
    </AuthProvider>
  )
}

export default MyApp
