import { JobJson } from "bullmq"
import { GetServerSideProps } from "next"
import { getServerSession } from "next-auth/next"
import Link from "next/link"
import { useRouter } from "next/router"
import Button from "../../../components/_utils/Button"
import { shops } from "../../../data/shopsClient"
import { FigureWorkerJob, ListingWorkerJob, MfcLinkWorkerJob, WorkerJob } from "../../../types/WorkerJob"
import { authOptions } from "../../api/auth/[...nextauth]"

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session || !session.user || !session.user.admin) throw new Error('Unauthorized')

    const queuesRes = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/queues/`, {
      method: 'GET',
      headers: {
        'X-Session-Token': JSON.stringify(session)
      }
    })
    const queues = await queuesRes.json() as { [key: string]: JobJson[] }
  
    return {
      props: {
        queues
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

export default function Queues ({ queues }: { queues: { [key: string]: JobJson[] } }) {
  const router = useRouter()

  async function clearQueues () {
    try {
      const res = await fetch('/api/queues/clear', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (res.ok) {
        router.replace(router.asPath)
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <section className="container mx-auto">
      <div className="flex flex-col bg-zinc-100 dark:bg-zinc-800">
        <Button action={() => clearQueues()}>Clear</Button>
        <div>
          {
            ['active', 'delayed', 'waiting'].map(status => (
              <div key={status}>
                <h2 className="text-lg">{status} ({queues[status].length})</h2>
                <ul>
                  {
                    queues[status].map(job => {
                      const data = JSON.parse(job.data) as WorkerJob | ListingWorkerJob | FigureWorkerJob | MfcLinkWorkerJob
                      
                      switch (data.type) {
                        case 'listings':
                          return (
                            <li key={job.id}>#{job.id}: <Link href={`/figure/${data.figure.slug || data.figure._id.toString()}`}>{data.figure.name}</Link> in {shops[data.shop].name}</li>
                          )

                        case 'listing':
                          return (
                            <li key={job.id}>#{job.id}: {data.listing.title} in {shops[data.shop].name}</li>
                          )

                        case 'figure':
                          return (
                            <li key={job.id}>#{job.id}: {data.mfcLink}</li>
                          )

                        case 'mfcLink':
                          return (
                            <li key={job.id}>#{job.id}: {data.jan}</li>
                          )

                        default:
                          return (
                            <li key={job.id}>#{job.id}</li>
                          )
                      }
                    })
                  }
                </ul>
              </div>
            ))
          }
        </div>
      </div>
    </section>
  )
}
