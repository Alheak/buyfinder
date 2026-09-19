import { GetServerSidePropsContext } from 'next'
import { getServerSession } from 'next-auth'
import Head from 'next/head'
import SignIn from '../../components/Auth/SignIn'
import { authOptions } from '../api/auth/[...nextauth]'

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

export default function SignInPage () {
  return (
    <>
      <Head>
        <title>Sign In - buyfinder</title>
      </Head>

      <div className="container max-w-sm w-full mx-auto p-4">
        <h1 className="text-4xl my-8">Sign in</h1>
        <section className="flex flex-col">
          <div className="shadow-md rounded-md bg-zinc-50/75 dark:bg-zinc-800">
            <SignIn />
          </div>
        </section>
      </div>
    </>
  )
}
