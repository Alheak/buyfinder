import Link from "next/link"
import { useState } from "react"
import { shops } from "../../data/shopsClient"
import { Report } from "../../types/Report"
import PriceDisplay from "../_utils/Price"
import { getReportOption } from "../../types/Report"
import Button from "../_utils/Button"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faClipboard } from "@fortawesome/free-solid-svg-icons"
import Tag from "../_utils/Tag"
import ReactTimeAgo from "react-time-ago"

export default function ReportCard ({ report, onConfirm }: { report: Report, onConfirm: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [reason, setReason] = useState('')
  const figure = report.figure || report.listing.figure
  const type = report.type

  async function setReportisConfirmed (isConfirmed: boolean, attributePoints: boolean, deductPoints?: boolean) {
    if (isLoading) return

    setIsLoading(true)

    try {
      const res = await fetch('/api/reports/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: report._id,
          isConfirmed,
          attributePoints,
          deductPoints,
          reason
        })
      })
      
      if (res.ok) onConfirm()
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function addSearch (searchSuggestion: string) {
    if (isLoading) return
    if (!searchSuggestion) return

    setIsLoading(true)

    try {
      const res = await fetch('/api/reports/addSearch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop: report.shop,
          figure: figure._id,
          searchSuggestion
        })
      })
      
      if (res.ok) {
        const shopSearches = await res.json() as string[]

        report.searchSuggestion = undefined
        report.shopSearches = shopSearches
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div key={report._id.toString()} className="flex flex-col p-4 shadow-md rounded-md bg-white 100 dark:bg-zinc-800">
      {
        report.createdAt && (
          <h2 className="text-zinc-500">
            <ReactTimeAgo date={new Date(report.createdAt)} locale="en-US" />
          </h2>
        )
      }
      {
        report.user && (
          <h2>
            <span>User: {report.user.email}</span>
          </h2>
        )
      }
      {
        (type === 'falsePositive' && !!report.listing) && (
          <>
            <h2 className="flex justify-start items-center gap-2">
              <span>Listing: </span>
              <p className="flex rounded-md bg-zinc-100 dark:bg-zinc-900">
                <span className="px-1 shadow-inner">{report.listing._id.toString()}</span>
                <button
                  title="Copy the listing ID to clipboard"
                  className="px-2 rounded-r-md transition-colors text-white hover:text-black bg-blue-400 hover:bg-white"
                  onClick={() => navigator.clipboard.writeText(report.listing._id.toString())}
                >
                  <FontAwesomeIcon icon={faClipboard} />
                </button>
              </p>
            </h2>
            <h2>
              <a href={report.listing.url} target="_blank" rel="nofollow noreferrer">{report.listing.title || 'Untitled'}</a>
              <span> - </span>
              <PriceDisplay price={report.listing.price} currencyFrom={report.listing.currency || 'JPY'} /> (<PriceDisplay price={report.listing.price} currencyFrom={report.listing.currency || 'JPY'} currencyTo={report.userCurrency || 'JPY'} />) <Tag text={report.listing.condition === 'used' ? 'Used' : 'New'} bgColor={report.listing.condition === 'used' ? 'bg-yellow-700' : 'bg-sky-700'} />
            </h2>
          </>
        )
      }
      <h2>
        <span>Shop: {report.shop ? shops[report.shop].name : ''}</span>
      </h2>
      <h2 className="flex justify-start items-center gap-2">
        <span>Figure:</span>
        <p className="flex rounded-md bg-zinc-100 dark:bg-zinc-900">
          <span className="px-1 shadow-inner">{figure._id.toString()}</span>
          <button
            title="Copy the figure ID to clipboard"
            className="px-2 rounded-r-md transition-colors text-white hover:text-black bg-blue-400 hover:bg-white"
            onClick={() => navigator.clipboard.writeText(figure._id.toString())}
          >
            <FontAwesomeIcon icon={faClipboard} />
          </button>
        </p>
      </h2>
      <h2>
        <Link href={`/figure/${figure.slug || figure._id.toString()}`}>{figure.name}</Link>
        {
          !!figure.mfcLink && (
            <>
              <span> - </span><a href={figure.mfcLink} className="ml-2" target="_blank" rel="nofollow noreferrer">MFC entry</a>
            </>
          )
        }
      </h2>
      {
        !!report.shopSearches && (
          <>
            <h2>Searches used: </h2>
            <blockquote className="my-2 p-2 rounded-md shadow-inner italic bg-zinc-100 dark:bg-zinc-900">
              {
                report.shopSearches.map(shopSearch => (
                  <p key={shopSearch}>{shopSearch}</p>
                ))
              }
            </blockquote>
          </>
        )
      }
      {
        (!!report.reason && report.type === 'falsePositive') && (
          <p className="my-2 p-2 text-lg">
            Reason: {getReportOption(report.reason)}
          </p>
        )
      }
      {
        !!report.comment && (
          <>
            <hr className="mt-2 pb-2 border-zinc-300 dark:border-zinc-700" />
            <h2>User comment:</h2>
            <blockquote className="my-2 p-2 rounded-md shadow-inner bg-zinc-100 dark:bg-zinc-900">
              {report.comment}
            </blockquote>
          </>
        )
      }
      {
        !!report.searchSuggestion && (
          <>
            <h2>Search suggested: </h2>
            <blockquote className="my-2 p-2 rounded-md shadow-inner bg-zinc-100 dark:bg-zinc-900">
              {report.searchSuggestion}
            </blockquote>
            <Button isLoading={isLoading} action={() => addSearch(report.searchSuggestion || '')}>
              Add
            </Button>
          </>
        )
      }
      <h2>
        Add a reason for rejecting
      </h2>
      <textarea
        name="reason"
        id="Romment"
        className="w-full h-24 my-2 shadow-inner bg-zinc-100 dark: bg-zinc-900"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        required={type === 'falseNegative'}
      />
      <div className="flex mt-4 gap-4">
        {
          type === 'falsePositive' ? (
            <>
              <Button bgColor="bg-sky-500" isLoading={isLoading} action={() => setReportisConfirmed(true, true)}>
                Different items
              </Button>
              <Button bgColor="bg-yellow-500" isLoading={isLoading} action={() => setReportisConfirmed(false, true)}>
                Sold out/Wrong info
              </Button>
            </>
          ) : (
            <Button bgColor="bg-sky-500" isLoading={isLoading} action={() => setReportisConfirmed(true, true)}>
              Confirm
            </Button>
          )
        }
        <Button bgColor="bg-red-500" isLoading={isLoading} action={() => setReportisConfirmed(false, false)}>
          Wrong
        </Button>
        <Button bgColor="bg-red-500" isLoading={isLoading} action={() => setReportisConfirmed(false, false, true)}>
          Wrong and deduct for abuse
        </Button>
      </div>
    </div>
  )
}