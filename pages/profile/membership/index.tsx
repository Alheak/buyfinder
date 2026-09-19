import { GetServerSidePropsContext } from "next"
import { getServerSession } from "next-auth"
import { useSession } from "next-auth/react"
import { useState } from "react"
import Head from "next/head"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheckCircle, faExternalLink, faInfoCircle } from "@fortawesome/free-solid-svg-icons"
import { authOptions } from "../../api/auth/[...nextauth]"
import Layout from "../../../components/Profile/layout"
import Modal from "../../../components/_utils/Modal"
import SubscriptionForm from "../../../components/Premium/SubscriptionForm"
import PremiumNotice from "../../../components/Premium/Notice"
import LoadingSpinner from "../../../components/_utils/LoadingSpinner"

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  try {
    const session = await getServerSession(context.req, context.res, authOptions)

    if (!session) {
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

export default function Membership () {
  const { data: session, status } = useSession()

  return (
    <>
      <Head>
        <title>My Subscriptions - buyfinder</title>
      </Head>

      <Layout>
        <h1 className="mt-4 mb-8 text-4xl">My subscriptions</h1>
        <div className="flex flex-col justify-center items-center p-8">
          { 
            status === 'loading' ? (
              <LoadingSpinner />
            ) : (
              <>
                {
                  (session?.user.hasActiveSubscription || session?.user.watchPointsSubscription) && (
                    <>
                      <p className="mb-4">
                        <FontAwesomeIcon icon={faCheckCircle} />
                        <span className="ml-2">
                          Currently subscribed to {session?.user.hasActiveSubscription && 'Premium'}{(session?.user.hasActiveSubscription && session?.user.watchPointsSubscription) && ' and '}{session?.user.watchPointsSubscription && 'a monthly Watch Points recharge'}.
                        </span>
                      </p>
                      <a
                        className="h-10 px-4 py-2 shadow-md rounded-md bg-sky-600 text-white transition-colors hover:no-underline hover:bg-slate-200 hover:text-black"
                        href="https://billing.stripe.com/p/login/4gwg2R08I5RrcMgfYY"
                        rel="nofollow noreferrer"
                        target="_blank"
                      >
                        <span className="mr-2">
                          Manage my subscription{session?.user.hasActiveSubscription && session?.user.watchPointsSubscription ? 's' : ''}
                        </span>
                        <FontAwesomeIcon icon={faExternalLink} />
                      </a>
                    </>
                  )
                }
                {
                  !session?.user.hasActiveSubscription && (
                    <>
                      <hr className="w-full mt-8 border-zinc-400 dark:border-zinc-600" />
                      <div className="flex flex-col justify-center items-center mt-8">
                        <p className="mb-4 text-zinc-700 dark:text-zinc-300">
                          Not subscribed to Premium.
                        </p>
                        <PremiumNotice />
                      </div>
                    </>
                  )
                }
              </>
            )
          }
        </div>
      </Layout>
    </>
  )
}
