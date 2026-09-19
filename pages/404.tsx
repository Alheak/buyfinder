import Head from 'next/head'

export default function NotFound() {
  return (
    <>
      <Head>
        <title>404 - buyfinder</title>
      </Head>

      <div className="container flex items-center justify-center max-w-sm w-full min-h-s-screen mx-auto pt-12 pb-4 px-4">
        <h1 className="text-4xl my-8 text-center">Page not found.</h1>
      </div>
    </>
  )
}
