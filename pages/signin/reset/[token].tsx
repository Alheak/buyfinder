import { GetServerSideProps } from 'next'
import Head from 'next/head'
import TextInput from '../../../components/_utils/TextInput'
import Button from '../../../components/_utils/Button'
import React, { useState } from 'react'
import { useToast } from '../../../store/ToastContext'
import Router from 'next/router'

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

export default function ResetPassword ({ token }: { token: string }) {
  const { updateToast } = useToast()
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit (e: React.SyntheticEvent) {
    e.preventDefault()

    if (isLoading) return

    setIsLoading(true)

    try {
      await fetch('/api/auth/resetPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password
        })
      })

      updateToast('The password has been changed.', 'success')

      Router.push('/signin')
    } catch (error) {
      updateToast('Something went wrong trying to change the password. The token may have expired.', 'error')
    }

    setIsLoading(false)
  }

  return (
    <>
      <Head>
        <title>Password Reset - buyfinder</title>
      </Head>

      <div className="container max-w-sm w-full mx-auto p-4">
        <h1 className="text-4xl my-8">Password reset</h1>
        <section className="flex flex-col">
          <div className="shadow-md rounded-md bg-zinc-50/75 dark:bg-zinc-800">
            <form
              className="w-full p-4"
              onSubmit={(e) => handleSubmit(e)}
            >
              <TextInput title="New password" name="password" type="password" value={password} required update={(value) => setPassword(value)} />
              <TextInput className="mt-4" title="Repeat new password" name="passwordRepeat" type="password" value={passwordRepeat} required update={(value) => setPasswordRepeat(value)} />
              <Button className="mt-4" isLoading={isLoading} action={handleSubmit}>
                Send
              </Button>
            </form>
          </div>
        </section>
      </div>
    </>
  )
}
