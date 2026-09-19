import { GetServerSideProps } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../api/auth/[...nextauth]"
import Button from "../../../components/_utils/Button"
import { useState } from "react"
import { Report } from "../../../types/Report"
import Link from "next/link"
import { useRouter } from "next/router"
import Modal from "../../../components/_utils/Modal"
import ListingForm from "../../../components/Admin/ListingForm"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus } from "@fortawesome/free-solid-svg-icons"
import ReportCard from "../../../components/Admin/ReportCard"

export const getServerSideProps: GetServerSideProps = async ({ req, res, params, query }) => {
  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session || !session.user || !session.user.admin) throw new Error('Unauthorized')

    const reportsRes = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/reports/?type=${query.type ? query.type as string : 'falsePositive'}`, {
      method: 'GET',
      headers: {
        'X-Session-Token': JSON.stringify(session)
      }
    })
    const reports = await reportsRes.json() as Report[]
  
    return {
      props: {
        reports
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

export default function Reports ({ reports }: { reports: Report[] }) {
  const router = useRouter()
  const [showListingModal, setShowListingModal] = useState(false)
  const type = router.query.type === 'falseNegative' ? 'falseNegative' : 'falsePositive'

  function refreshReports () {
    router.replace(router.asPath)
  }

  return (
    <section className="container mx-auto">
      <div className="flex mt-4 px-4 rounded-t-md">
        <Link
          href="/admin/reports?type=falsePositive"
          className={`grow block p-2 rounded-tl-md text-center ${type === 'falsePositive' ? 'text-black dark:text-white bg-white dark:bg-zinc-800' : 'bg-zinc-100 dark:bg-zinc-900'}`}
        >
          False positives
        </Link>
        <Link
          href="/admin/reports?type=falseNegative"
          className={`grow block p-2 text-center ${type === 'falseNegative' ? 'text-black dark:text-white bg-white dark:bg-zinc-800' : 'bg-zinc-100 dark:bg-zinc-900'}`}
        >
          False negatives
        </Link>
        <Button action={() => setShowListingModal(true)}>
          <FontAwesomeIcon icon={faPlus} />
          <span className="ml-2">Listing</span>
        </Button>
      </div>
      <div className="flex flex-col gap-4 shadow-md rounded-md bg-zinc-100 dark:bg-zinc-800">
        {
          reports.map(report => <ReportCard key={report._id.toString()} report={report} onConfirm={() => refreshReports()} />)
        }
      </div>
      {
        showListingModal && (
          <Modal title="Create a new listing" onClose={() => setShowListingModal(false)}>
            <ListingForm close={() => setShowListingModal(false)} />
          </Modal>
        )
      }
    </section>
  )
}
