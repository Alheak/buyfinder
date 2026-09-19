import { GetServerSideProps } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../api/auth/[...nextauth]"
import { Bar } from "react-chartjs-2"
import 'chart.js/auto'
import 'chartjs-adapter-moment'
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import Button from "../../../components/_utils/Button"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons"

const ONE_DAY = 1000 * 60 * 60 * 24
const ONE_MONTH = ONE_DAY * 30

export const getServerSideProps: GetServerSideProps = async ({ req, res, query }) => {
  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session || !session.user || !session.user.admin) throw new Error('Unauthorized')

    const paramsString = new URLSearchParams({ ...query as ({ [key: string]: string} ) }).toString()
    const searchesRes = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/searches/?${paramsString}`, {
      method: 'GET',
      headers: {
        'X-Session-Token': JSON.stringify(session)
      }
    })
    const searches = await searchesRes.json()
  
    return {
      props: {
        searches
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

export default function AdminSearches ({ searches }: { searches: { x: string, y: number }[] }) {
  const router = useRouter()
  const [from, setFrom] = useState(router.query.from ? parseInt(router.query.from as string) : Date.now() - ONE_MONTH)
  const [to, setTo] = useState(router.query.to ? parseInt(router.query.to as string) : Date.now())
  const fromDate = new Date(from)
  const fromDateString = `${fromDate.getFullYear()}/${fromDate.getMonth() + 1}/${fromDate.getDate() + 1}`
  const toDate = new Date(to)
  const toDateString = `${toDate.getFullYear()}/${toDate.getMonth() + 1}/${toDate.getDate() + 1}`
  const datasets = [{
    label: 'Searches per day',
    data: searches
  }]

  function prevDate () {
    setFrom(prev => prev - ONE_MONTH)
    setTo(prev => prev - ONE_MONTH)
  }

  function nextDate () {
    setFrom(prev => prev + ONE_MONTH)
    setTo(prev => prev + ONE_MONTH)
  }

  useEffect(() => {
    router.push({ query: { from, to } })
  }, [from, to])

  return (
    <div className="container mx-auto p-4">
      <div className="flex w-full mb-4">
        <Button action={() => prevDate()}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </Button>
        <div className="grow flex justify-around items-center">
          <p>
            From {fromDateString} to {toDateString}
          </p>
        </div>
        <Button action={() => nextDate()}>
          <FontAwesomeIcon icon={faArrowRight} />
        </Button>
      </div>
      <Bar
        datasetIdKey="Prices"
        data={{
          datasets
        }}
        options={{
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              type: 'time',
              time: {
                parser: 'YYYY-MM-DD',
                tooltipFormat: 'll',
                displayFormats: {
                  'day': 'MM/DD',
                  'week': 'MM/DD',
                  'month': 'YY/MM'
                }
              }
            },
            y: {
              beginAtZero: true
            }
          }
        }}
      />
    </div>
  )
}
