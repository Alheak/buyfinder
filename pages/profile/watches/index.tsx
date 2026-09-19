import { GetServerSidePropsContext } from "next"
import { getServerSession } from "next-auth"
import Head from "next/head"
import { Watch } from "../../../types/Watch"
import { authOptions } from "../../api/auth/[...nextauth]"
import WatchCard from "../../../components/Profile/WatchCard"
import { useEffect, useState } from "react"
import Layout from "../../../components/Profile/layout"
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

    const res = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/watches`, {
      headers: {
        'X-Session-Token': JSON.stringify(session)
      }
    })
    const watches = await res.json() as Watch[]
  
    return {
      props: {
        watches
      }
    }
  } catch (error) {
    console.error(error)

    return {
      props: {
        watches: []
      }
    }
  }
}

export default function Watches ({ watches }: { watches: Watch[] }) {
  const [shownWatches, setShownWatches] = useState(watches)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMoreWatches, setHasMoreWatches] = useState(true)
  const [docHeight, setDocHeight] = useState(typeof window === 'undefined' ? 0 : window.document.documentElement.scrollHeight)
  const [windowHeight, setWindowHeight] = useState(typeof window === 'undefined' ? 0 : window.innerHeight)
  const [scrolledPixels, setScrolledPixels] = useState(typeof window === 'undefined' ? 0 : window.scrollY)

  const pixelsLeftToScroll = docHeight - windowHeight - scrolledPixels
  const earliestWatch = shownWatches.length ? shownWatches[shownWatches.length - 1] : null

  function updateWatch (index: number, editedWatch: Watch) {
    setShownWatches(prev => [
      ...prev.slice(0, index),
      editedWatch,
      ...prev.slice(index + 1)
    ])
  }

  async function fetchMoreWatches () {
    if (isLoading || !hasMoreWatches) return

    setIsLoading(true)

    try {
      const res = await fetch(`/api/watches?from=${earliestWatch?.updatedAt || ''}`)
      const newWatches = await res.json() as Watch[]

      if (!newWatches || !newWatches.length) {
        setHasMoreWatches(false)

        return
      }

      setShownWatches(prev => [...prev, ...newWatches])
      updateScroll()
    } catch (error) {
      console.error('Something went wrong trying to fetch watches.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!hasMoreWatches) return

    if (pixelsLeftToScroll < 200) fetchMoreWatches()
  }, [pixelsLeftToScroll])

  const updateScroll = () => {
    setDocHeight(window.document.documentElement.scrollHeight)
    setWindowHeight(window.innerHeight)
    setScrolledPixels(window.scrollY)
  }

  useEffect(() => {
    window.addEventListener('resize', updateScroll)
    window.addEventListener('scroll', updateScroll, { passive: true })

    return () => {
      window.removeEventListener('resize', updateScroll)
      window.removeEventListener('scroll', updateScroll)
    }
  }, [])

  return (
    <>
      <Head>
        <title>My Watches - buyfinder</title>
      </Head>

      <Layout>
        <h1 className="mt-4 mb-8 text-4xl">My watches</h1>
        <section className="flex flex-col gap-8">
          {
            shownWatches && shownWatches.length ? (
              shownWatches.map((watch, index) => (
                <WatchCard
                  key={watch._id.toString()}
                  watch={watch}
                  onEdit={(editedWatch) => updateWatch(index, editedWatch)}
                  onDelete={() => setShownWatches(prevWatches => prevWatches.filter(prevWatch => prevWatch.figure._id.toString() !== watch.figure._id.toString()))}
                />
              ))
            ) : (
              <div className="text-center text-xl text-zinc-500">
                No watches
              </div>
            )
          }
          {
            isLoading && (
              <div className="flex justify-center items-center p-4 text-black dark:text-white">
                <LoadingSpinner />
                <span className="ml-2">Loading more watches...</span>
              </div>
            )
          }
        </section>
      </Layout>
    </>
  )
}
