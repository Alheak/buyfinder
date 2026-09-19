import { GetServerSidePropsContext } from 'next'
import { getServerSession } from 'next-auth'
import Head from 'next/head'
import { authOptions } from '../../api/auth/[...nextauth]'
import TextInput from '../../../components/_utils/TextInput'
import Button from '../../../components/_utils/Button'
import React, { useState } from 'react'
import { useToast } from '../../../store/ToastContext'

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  try {
    const session = await getServerSession(context.req, context.res, authOptions)
    
    if (!!session) {
      return {
        redirect: {
          destination: '/'
        }
      }
    }

    return {
      props: {}
    }
  } catch (error) {
    console.error('Error when getting session', error)

    return {
      redirect: {
        destination: '/'
      }
    }
  }
}

export default function PasswordReset () {
  const { updateToast } = useToast()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  async function handleSubmit (e: React.SyntheticEvent) {
    e.preventDefault()

    if (isLoading) return

    setIsLoading(true)

    try {
      const res = await fetch(`/api/auth/passwordReset?email=${email}`)

      if (res.ok) setIsSent(true)
    } catch (error) {
      updateToast('Something went wrong trying to send the email. Verify the address and try again.', 'error')
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
              <TextInput title="Email" name="email" type="email" value={email} required disabled={isSent} update={(value) => setEmail(value)} />
              {
                !isSent ? (
                    <Button className="mt-4" isLoading={isLoading} action={handleSubmit}>
                      Send
                    </Button>
                ) : (
                  <h1 className="p-2 text-lg rounded-md bg-sky-900">
                    {`
                      An email has been sent to the address you provided. Check your inbox and follow the instructions.

                      Don't forget to verify your spam folder if you don't see anything after a few minutes.
                    `}
                  </h1>
                )
              }
            </form>
          </div>
        </section>
      </div>
    </>
  )
}
