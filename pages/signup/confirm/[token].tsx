import { GetServerSideProps } from 'next'
import Head from 'next/head'
import React from 'react'
import Link from 'next/link'

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  try {
    const res = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/auth/activateAccount?token=${params?.token}`)
    const { tokenIsValid } = await res.json()

    if (!tokenIsValid) {
      return {
        props: {},
        redirect: {
          destination: '/404'
        }
      }
    }
  
    return {
      props: {
        token: params?.token
      }
    }
  } catch (error) {
    console.error(error)

    return {
      props: {},
      redirect: {
        destination: '/404'
      }
    }
  }
}

export default function AccountActivation () {
  return (
    <>
      <Head>
        <title>Account activation - buyfinder</title>
      </Head>

      <div className="container max-w-sm w-full mx-auto p-4">
        <h1 className="text-4xl my-8">Account activation</h1>
        <section className="flex flex-col">
          <div className="shadow-md rounded-md bg-zinc-50/75 dark:bg-zinc-800">
            <div className="w-full p-4">
              <p>
                Your account has been successfully activated.
              </p>
              <p className="mt-4 text-center">
                <Link href="/signin">Sign in</Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
