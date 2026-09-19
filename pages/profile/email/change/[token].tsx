import { GetServerSideProps } from 'next'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import React, { useEffect } from 'react'
import Notice from '../../../../components/_utils/Notice'

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  try {
    const res = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/auth/token?token=${params?.token}`)
    const { tokenIsValid } = await res.json()

    if (!tokenIsValid) {
      return {
        props: {},
        redirect: {
          destination: '/404'
        }
      }
    }
  
    await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/auth/confirmEmailChange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            token: params?.token
        })
    })

    return {
      props: {
        success: true
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

export default function ChangeEmail ({ success }: { success: boolean }) {
  const { update: updateSession } = useSession()

  async function refreshSession () {
    await updateSession()
  }

  useEffect(() => {
    refreshSession()
  }, [])

  return (
    <>
      <Head>
        <title>Email Change - buyfinder</title>
      </Head>

      <div className="container max-w-sm w-full mx-auto p-4">
        <h1 className="text-4xl my-8">Email change</h1>
        <section className="flex flex-col">
          <div className="shadow-md rounded-md bg-zinc-50/75 dark:bg-zinc-800">
            {
                success ? (
                    <Notice type="info">
                        Your email address has been successfully changed.
                    </Notice>
                ) : (
                    <Notice type="warning">
                        Something went wrong trying to change the email address.
                    </Notice>
                )
            }
          </div>
        </section>
      </div>
    </>
  )
}
