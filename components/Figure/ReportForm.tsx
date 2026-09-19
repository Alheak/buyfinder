import { useEffect, useMemo, useState } from "react"
import Button from "../_utils/Button"
import { useToast } from "../../store/ToastContext"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Listing } from "../../types/Listing"
import { ReportReason, getReportOption } from "../../types/Report"
import { shops } from "../../data/shopsClient"
import Select from "../_utils/Select"
import Notice from "../_utils/Notice"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faExternalLink, faRefresh } from "@fortawesome/free-solid-svg-icons"
import { useCurrency } from "../../store/CurrencyContext"

export default function ReportForm ({ type, listing, figureId, shop, canRefresh, close }: { type: 'falseNegative' | 'falsePositive', listing?: Listing, figureId?: string, shop: string, canRefresh?: boolean, close: () => void }) {
  const { data: session } = useSession()
  const { currency: userCurrency } = useCurrency()
  const { updateToast } = useToast()
  const [reportReason, setReportReason] = useState<ReportReason | null>(null)
  const [comment, setComment] = useState('')
  const [warningRead, setWarningRead] = useState(false)
  const [watchPointsAmount, setWatchPointsAmount] = useState<number | null>(null)
  const [searches, setSearches] = useState<string[]>([])
  const [searchSuggestion, setSearchSuggestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const shopInfo = shops[shop]
  const warning = useMemo(() => {
    switch (reportReason) {
      case 'price':
        if (shopInfo.exchangeRatesWarning || shopInfo.locationPriceWarning) {
          return (
            <span className="text-sm">
              You are about to report this result for having a wrong price, however {shopInfo.name} is known for having {shopInfo.exchangeRatesWarning ? 'skewed exchange rates' : 'prices that vary depending on your location'}, meaning that the price displayed on buyfinder might be slightly different than the one on {shopInfo.name}. <br />
              The issue is known and unfortunately unfixable. <br />
              A small discrepancy is expected in this case, and your report will not be confirmed unless the price is obviously and unreasonably incorrect.
            </span>
          )
        }

        break
      
      case 'soldout':
        if (shopInfo.shippingWarning) {
          return (
            <span className="text-sm">
              You are about to report this result for being sold out, however {shopInfo.name} is known for displaying or hiding their listings depending on your location. <br />
              In this case, to see the listing, it might be necessary to change your shipping address on {shopInfo.name} or to use a VPN. <br />
              Your report will not be confirmed if the listing is found to be available.
            </span>
          )
        } else if (shopInfo.inStockWishlistWarning) {
          return (
            <span className="text-sm">
              You are about to report this result for being sold out, however {shopInfo.name} is known for displaying products as being in stock in their search results but unavailable on the product page. <br />
              This usually means the product is about to get restocked soon but orders can&apos;t be placed for now, so customers should use the wishlist functionnality instead. <br />
              It is a weird system but buyfinder can&apos;t do much about it and your report will be denied if the item is displayed as available in the shop&apos;s search engine (but not the product page.)
            </span>
          )
        } else if (shopInfo.stockStatusWarning) {
          return (
            <span className="text-sm">
              You are about to report this result for being sold out, however {shopInfo.name} is known for only displaying the actual stock status of certain items to users with a  {shopInfo.name} account. <br />
              Because buyfinder can only verify publicly available results, it is possible that the item is not actually available for purchase.
              <br />
              There is no known solution to this problem, so your report might be denied if the listing is displayed as being in stock on the public version of {shopInfo.name}.
            </span>
          )
        }

        break
      
      case 'broken':
        if (shopInfo.siteIsBrokenNotice) {
          return (
            <span className="text-sm">
              You are about to report this result for having a broken link, however {shopInfo.name} is known for having a bug which prevents people from accessing the website.<br />
              In this case, to see the listing, it might be necessary to visit <a className="font-bold underline" href="https://ekizo.mandarake.co.jp/auction/item/indexEn.html">this page first</a>, then try visiting the result again. <br />
              Your report will not be confirmed if the link is found to not be broken otherwise.
            </span>
          )
        } else if (shopInfo.accountWarning) {
          return (
            <span className="text-sm">
              You are about to report this result for having a broken link, however {shopInfo.name} is known for hiding their listings from users without an account on their website or to users who set their account to hide NSFW items.<br />
              In this case, to see the listing, it might be necessary to sign into your {shopInfo.name} account or to change your {shopInfo.name} account settings. <br />
              Your report will not be confirmed if the link is found to not actually be broken.
            </span>
          )
        }

        break

      case 'other':
        return (
          <span className="text-sm">
            Do not use the &quot;Other&quot; option to bypass warnings on another one. <br />
            200 Watch Points can be deducted from your account for doing so. <br />
            If something seems unclear, please <a href="mailto:buyfinder.moe@gmail.com">contact us</a>.
          </span>
        )

      default:
        return ''
    }
  }, [reportReason])
  const formIsDisabled = (reportReason === 'soldout' || reportReason === 'price' || type === 'falseNegative') && canRefresh
  const canReport = (type === 'falseNegative' && !comment) || formIsDisabled || (!!warning && !warningRead)

  async function submit () {
    if (isLoading || (type === 'falsePositive' && !reportReason)) return

    setIsLoading(true)

    try {
      const res = await fetch('/api/reports/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          reason: reportReason,
          listingId: listing?._id,
          figureId,
          shop,
          comment,
          searchSuggestion,
          userCurrency
        })
      })

      if (res.ok) {
        const resContent = await res.json()

        switch (resContent.reportStatus) {
          case 'created':
            updateToast('Report sent. Thank you for your help!', 'success')
            break

          case 'exists':
            updateToast('A report for this listing already exists.', 'info')
            break

          default:
            updateToast('Report sent. Thank you for your help!', 'success')
        }

        close()
      } else {
        updateToast('Something went wrong trying to create the report.', 'error')
      }
    } catch (error) {
      updateToast('Something went wrong trying to submit the report.', 'error')
    }

    setIsLoading(false)
  }

  async function getWatchPointsAmount() {
    try {
      const res = await fetch(`/api/reports/watchPointsAmount?figure=${figureId}&shop=${shop}`)
      const watchPoints = await res.json() as number
      
      setWatchPointsAmount(watchPoints)
    } catch (error) {
    }
  }

  async function getSearches() {
    try {
      const res = await fetch(`/api/listings/searches?shop=${shop}&figure=${figureId}`)
      const listingSearches = await res.json() as string[]
      
      setSearches(listingSearches)
    } catch (error) {
    }
  }

  useEffect(() => {
    if (!listing?.isAccurate) getSearches()

    getWatchPointsAmount()

    return () => {
      setSearches([])
      setWatchPointsAmount(null)
    }
  }, [])

  return (
    <div className="w-96 p-4">
      <div className="mb-4">
        <Notice>
          Be sure to <a href="/faq#Reports" target="_blank">read the FAQ <FontAwesomeIcon icon={faExternalLink} /></a> first!
        </Notice>
      </div>
      <p className="mb-2">
        {
          (type === 'falsePositive' && !!listing) && (
            <span className="text-sm">
              Currently reporting <span className="p-0.5 italic bg-slate-200 dark:bg-zinc-900 rounded-sm">{listing.title || listing.url}</span> on <strong>{shops[listing.shop].name}</strong>
            </span>
          ) 
        }
        {
          (type === "falseNegative" && !!shop) && (
            <span className="text-sm">
              Currently reporting a missing hit in <strong>{shops[shop].name}</strong>
            </span>
          )
        }
      </p>
      {
        type === 'falsePositive' && (
          <>
            <label htmlFor="ReportReason">
              Reason
            </label>
            <Select name="ReportReason" id="ReportReason" className="w-full mb-4" value={reportReason} placeholder="Select in the list" required update={(value) => setReportReason(value)}>
              <>
                {
                  (['wrong', 'bootleg', 'broken', 'soldout', 'price', 'condition', 'other'] as const).map((reason: ReportReason) => (
                    <option key={reason} value={reason}>{getReportOption(reason)}</option>
                  ))
                }
              </>
            </Select>
          </>
        )
      }
      {
        (!!reportReason || type === 'falseNegative') && (
          <>
            {
              formIsDisabled ? (
                <>
                  <Notice type="warning">
                    Results are out-of-date, please click the <span className="inline-block"><FontAwesomeIcon className="text-red-500" icon={faRefresh} /> refresh button</span> before reporting
                  </Notice>
                  <br />
                  <Button isLoading={isLoading} textColor="text-black dark:text-white" bgColor="bg-zinc-100 dark:bg-zinc-600 hover:bg-white hover:dark:bg-zinc-500" action={close}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  {
                    (!!warning || (type === 'falseNegative' && shopInfo.nsfwBlock)) && (
                      <>
                        <Notice type="info" position="top">
                          { warning || (
                            <span>
                              You are about to report a missing result, however {shopInfo.name} is known for hiding NSFW listings from the public internet and cannot be searched by buyfinder. <br />
                              For this reason, your report will not be confirmed if the item you&apos;re searching for is NSFW.
                            </span>
                          ) }
                          <label className="flex gap-2 mt-2 -mb-3 -mx-3 px-3 py-2 rounded-b-md bg-slate-300 dark:bg-slate-600" htmlFor="WarningRead">
                            <input type="checkbox" name="WarningRead" id="WarningRead" checked={warningRead} onChange={() => setWarningRead(prev => !prev)}/>
                            <span>I understand</span>
                          </label>
                        </Notice>
                        <br />
                      </>
                    )
                  }
                  <label htmlFor="Comment">
                    {
                      type === 'falseNegative' ? (
                        <span>Link to the product page (required)</span>
                      ) : (
                        <span>Additional information (optional)</span>
                      )
                    }
                  </label>
                  <textarea
                    name="comment"
                    id="Comment"
                    className="w-full h-24 my-2 border"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required={type === 'falseNegative'}
                  />
                  {
                    !!searches.length && (
                      <>
                        <h3 className="italic text-sm">Queries used to find the item on {shop ? shops[shop].name : 'the shop\'s website'}:</h3>
                        <ul className="mb-2 px-2 py-1 rounded-md divide-y divide-zinc-400 dark:divide-zinc-700 bg-zinc-100 dark:bg-zinc-900">
                          {
                            searches.slice(0, 8).map(search => (
                              <li key={search} className="italic text-sm">{search}</li>
                            ))
                          }
                        </ul>
                        <label className="italic text-sm" htmlFor="SearchSuggestion">
                          If you believe the queries used are not accurate enough, you can suggest one in the field below (optional):
                        </label>
                        <input
                          type="text"
                          name="searchSuggestion"
                          id="SearchSuggestion"
                          className="w-full mb-4 border"
                          value={searchSuggestion}
                          onChange={(e) => setSearchSuggestion(e.target.value)}
                        />
                      </>
                    )
                  }
                  <Button disabled={canReport} isLoading={isLoading} action={() => submit()}>
                    Send
                  </Button>
                  {
                    !session && (
                      <p className="mt-2 text-sm">
                        Note: You are not <Link href="/signin">signed in</Link>. You won&apos;t earn any <Link href="/faq#Reports" target="_blank">watch points <FontAwesomeIcon icon={faExternalLink} /></Link>.
                      </p>
                    )
                  }
                  {
                    (!!session && watchPointsAmount !== null) && (
                      <p className="mt-2 text-sm">
                        You&apos;ll earn <strong>{watchPointsAmount}</strong> Watch Points if your report is confirmed.
                      </p>
                    )
                  }
                </>
              )
            }
          </>
        )
      }
    </div>
  )
}
