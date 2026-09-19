import { GetServerSideProps } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../api/auth/[...nextauth]"
import Button from "../../../components/_utils/Button"
import { useState } from "react"
import { CleanupRequest } from "../../../types/CleanupRequest"
import Link from "next/link"

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session || !session.user || !session.user.admin) throw new Error('Unauthorized')

    const cleanupRequestsRes = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/cleanupRequests/`, {
      method: 'GET',
      headers: {
        'X-Session-Token': JSON.stringify(session)
      }
    })
    const cleanupRequests = await cleanupRequestsRes.json() as CleanupRequest[]
  
    return {
      props: {
        cleanupRequests
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

export default function CleanupRequests ({ cleanupRequests }: { cleanupRequests: CleanupRequest[] }) {
  const [loading, setLoading] = useState<number[]>([])

  async function setCleanupRequestisConfirmed (index: number) {
    if (loading.includes(index)) return

    const cleanupRequest = cleanupRequests[index]

    setLoading(prev => [...prev, index])

    try {
      const res = await fetch('/api/cleanupRequests/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: cleanupRequest._id
        })
      })
      
      if (res.ok) {
        const index = cleanupRequests.map(cleanupRequest => cleanupRequest._id.toString()).indexOf(cleanupRequest._id.toString())

        cleanupRequests.splice(index, 1)
      }
    } catch (error) {
      console.error(error)
    }

    setLoading(prev => [...prev.filter(prevIndex => prevIndex !== index)])
  }

  return (
    <section className="container mx-auto">
      <div className="flex flex-col bg-zinc-100 dark:bg-zinc-800">
        {
          cleanupRequests.map((cleanupRequest, index) => {
            const figure = cleanupRequest.figure

            return (
              <div key={cleanupRequest._id.toString()} className="flex flex-col p-4 shadow-md rounded-md bg-zinc-800">
                <h2>
                  <span>Figure: </span>
                  <Link href={`/figure/${figure.slug || figure._id.toString()}`}>{figure.name}</Link>
                  {
                    !!figure.mfcLink && (
                      <>
                        <span> - </span>
                        <a href={figure.mfcLink} className="ml-2" target="_blank" rel="nofollow noreferrer">MFC entry</a>
                      </>
                    )
                  }
                </h2>
                <div className="flex mt-4 gap-4">
                  <Link
                    className="h-10 px-4 py-2 shadow-md rounded-md text-white hover:text-black bg-sky-600 hover:bg-white transition-colors"
                    href={`/admin/listings/${figure._id.toString()}`}
                    target="_blank"
                  >
                    Check listings
                  </Link>
                  <Button bgColor="bg-sky-500" isLoading={loading.includes(index)} action={() => setCleanupRequestisConfirmed(index)}>
                    Done
                  </Button>
                </div>
              </div>
            )
          })
        }
      </div>
    </section>
  )
}
