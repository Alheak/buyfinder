import { GetServerSidePropsContext } from "next"
import { getServerSession } from "next-auth/next"
import Head from "next/head"
import { authOptions } from "../api/auth/[...nextauth]"
import SignUp from "../../components/Auth/SignUp"

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

export default function SignUpPage () {
  return (
    <>
      <Head>
        <title>Sign Up - buyfinder</title>
      </Head>

      <div className="container max-w-sm w-full mx-auto p-4">
        <h1 className="text-4xl my-8">Sign up</h1>
        <section className="flex flex-col">
          <div className="shadow-md rounded-md bg-zinc-50/75 dark:bg-zinc-800">
            <SignUp />
          </div>
        </section>
      </div>
    </>
  )
}
