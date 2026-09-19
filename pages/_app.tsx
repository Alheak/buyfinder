import '../styles/globals.scss'
import React, { useEffect } from 'react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import Router from 'next/router'
import { SessionProvider } from 'next-auth/react'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { StoreProvider } from '../store/StoreProvider'
import Layout from '../components/_misc/layout'
import Loading from '../components/_misc/loading'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en.json'

TimeAgo.addDefaultLocale(en)

config.autoAddCss = false

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const [loading, setLoading] = React.useState(false)

  useEffect(() => {
    const start = () => {
      setLoading(true)
    }

    const end = () => {
      setLoading(false)
    }

    Router.events.on("routeChangeStart", start)
    Router.events.on("routeChangeComplete", end)
    Router.events.on("routeChangeError", end)

    return () => {
      Router.events.off("routeChangeStart", start)
      Router.events.off("routeChangeComplete", end)
      Router.events.off("routeChangeError", end)
    }
  }, [])

  return (
    <React.StrictMode>
      <Head>
        <meta name="description" content="Helps you find the best places to buy anime figures online by searching over 50 websites at once and comparing prices." />
        <meta property="og:image" content={`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/apple-touch-icon.png`} />
        <meta property="og:url" content="https://buyfinder.moe" />
        <meta property="og:site_name" content="buyfinder" />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width,initial-scale=0.9" />
        <meta name="twitter:card" content="app"></meta>
        <meta name="twitter:creator" content="@alheak1"></meta>
        <link rel="apple-touch-icon" sizes="180x180" href={`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/apple-touch-icon.png`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/favicon-32x32.png`} />
        <link rel="icon" type="image/png" sizes="16x16" href={`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/favicon-16x16.png`} />
        <link rel="manifest" href={`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/site.webmanifest`} />
      </Head>

      <SessionProvider session={session}>
        <StoreProvider>
          <Layout>
            {
              loading && (
                <Loading />
              )
            }
            <Component {...pageProps} />
          </Layout>
        </StoreProvider>
      </SessionProvider>
    </React.StrictMode>
  )
}

export default App
