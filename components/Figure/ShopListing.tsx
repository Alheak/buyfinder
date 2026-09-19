import countries from 'i18n-iso-countries'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBan, faBoxesStacked, faChevronDown, faChevronUp, faCircleExclamation, faFlag, faHeartCirclePlus, faInfoCircle, faMoneyBillTrendUp, faRefresh, faSun, faTimes, faTruckRampBox, faUser, faWarning } from '@fortawesome/free-solid-svg-icons'
import * as flags from 'country-flag-icons/react/3x2'
import { Listing } from '../../types/Listing'
import { Figure } from '../../types/Figure'
import FigureListing from './FigureListing'
import PriceDisplay from '../_utils/Price'
import Tag from '../_utils/Tag'
import { shops } from '../../data/shopsClient'
import React, { useEffect, useState } from 'react'
import Modal from '../_utils/Modal'
import ReportForm from './ReportForm'
import Tooltip from '../_utils/Tooltip'
import { ShopInfo } from '../../types/Shops'
import { useSession } from 'next-auth/react'
import ReactTimeAgo from 'react-time-ago'
import LoadingSpinner from '../_utils/LoadingSpinner'

countries.registerLocale(require("i18n-iso-countries/langs/en.json"))

function getIsAccurate (listings: Listing[] | null, figure: Figure | undefined, shop: ShopInfo) {
  if (!listings || !listings.length) return true
  if (shop.isAccurate !== undefined) return shop.isAccurate

  const evaluatedListings = listings.filter(listing => listing.isAccurate !== undefined)

  if (
    !!evaluatedListings &&
    !!evaluatedListings.length
  ) return !evaluatedListings.find(listings => !listings.isAccurate)

  const hasJan = !!figure?.releases.find(release => !!release.jan)

  return hasJan
}

function Warning ({ children, bgColor = 'bg-yellow-500 dark:bg-yellow-600', textColor = 'text-black' }: { children: React.ReactNode, bgColor?: string, textColor?: string }) {
  return (
    <p className={`flex items-center px-2 py-1 gap-2 rounded-t-md shadow-md text-xs font-bold ${textColor} ${bgColor}`}>
      {children}
    </p>
  )
}

export default function ShopListing ({ listings, figure, shop, lastSearch, isLoading, canRefresh, refresh, remove }: { listings: Listing[] | null, figure?: Figure, shop: string, lastSearch?: number, isLoading?: boolean, canRefresh?: boolean, refresh?: () => void, remove?: (index: number) => void }) {
  const { data: session } = useSession()
  const [flaggedListingIndex, setFlaggedListingIndex] = useState<number | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showAllListings, setShowAllListings] = useState(false)
  const shopInfo = shops[shop]

  const isAccurate = shop === 'mfc' || getIsAccurate(listings, figure, shopInfo)
  const isAffiliate = shopInfo && shopInfo.affiliateUrlAppend
  const url = listings && listings.length ? listings[0].url + (isAffiliate ? shopInfo.affiliateUrlAppend : '') : ''
  const hasFigureListings = (!!listings && listings.length > 1) || !isAccurate
  const hasWarnings = !isAccurate ||
    shopInfo.isDomesticOnly ||
    shopInfo.canShipTo?.length ||
    shopInfo.bootlegWarning ||
    shopInfo.exchangeRatesWarning ||
    shopInfo.locationPriceWarning ||
    (shopInfo.accountWarning && figure?.name.includes('NSFW')) ||
    shopInfo.shippingWarning ||
    shopInfo.inStockWishlistWarning ||
    shopInfo.stockStatusWarning

  const Flag = shopInfo.country && shopInfo.country !== 'global' ? flags[shopInfo.country?.toUpperCase() as keyof typeof flags] : null
  const countryName = shopInfo.country ? 
    (
      countries.getName(shopInfo.country, 'en') ||
      (
        shopInfo.country === 'EU' ? 'Europe' : shopInfo.country
      )
    ) : null

  const firstListingWithPrice = listings?.find(listing => !!listing.price && !listing.priceIsTBD)

  function toggleShowAllListings (e: React.SyntheticEvent) {
    e.preventDefault()

    setShowAllListings(prev => !prev)
  }

  function report (e: React.SyntheticEvent, index: number) {
    e.preventDefault()
  
    setFlaggedListingIndex(index)
  }

  function removeListing (e: React.SyntheticEvent, index: number) {
    e.preventDefault()

    if (
      !!remove &&
      !!listings &&
      !!listings.length &&
      window.confirm('Are you sure you want to remove this listing?')
    ) {
      remove(index)
    }
  }

  function refreshListing (e: React.SyntheticEvent) {
    e.preventDefault()
  
    if (!!refresh) refresh()
  }

  useEffect(() => {
    setShowReportModal(flaggedListingIndex !== null)
  }, [flaggedListingIndex])

  useEffect(() => {
    if (!showReportModal) setFlaggedListingIndex(null)
  }, [showReportModal])

  const LastChecked = () => {
    return (
      <>
        <p className={`flex flex-row items-center gap-1 text-sm ${canRefresh ? 'text-red-500' : 'text-zinc-600 dark:text-zinc-400'}`}>
          {
            !!lastSearch && (
              <>
                {
                  canRefresh && (
                    <FontAwesomeIcon icon={faCircleExclamation} />
                  )
                }
                <span>
                  Last checked <ReactTimeAgo date={new Date(lastSearch)} locale="en-US" />
                </span>
              </>
            )
          }
          {
            (session?.user.admin || canRefresh) && (
              <button className="ml-1 px-2 py-1 text-sm bg-red-700 text-white rounded-md cursor-pointer" title="Refresh the result" onClick={(e) => refreshListing(e)}>
                <FontAwesomeIcon icon={faRefresh} />
                <span className="ml-1">Refresh</span>
              </button>
            )
          }
        </p>
      </>
    )
  }

  return (
    <>
      {
        (listings && shop) && (
          <div className="relative my-2 hover:no-underline">
            {
              hasWarnings && (
                <div className="flex px-2 gap-2">
                  {
                    (shopInfo.isDomesticOnly || shopInfo.canShipTo?.length) && (
                      <div className="relative">
                        <Tooltip info="Countries available for shipping" fullWidth>
                          <Warning bgColor="bg-sky-600" textColor="text-white">
                            <FontAwesomeIcon icon={faTruckRampBox} />
                            <span>{(shopInfo.canShipTo?.length || 0) > 1 ? shopInfo.canShipTo?.map(country => (countries.getName(country, 'en') || country)).join(', ') : countryName} only</span>
                          </Warning>
                        </Tooltip>
                      </div>
                    )
                  }
                  {
                    shopInfo.shippingWarning && (
                      <div className="relative">
                        <Tooltip info={`Might not ship to your country`} fullWidth>
                          <Warning bgColor="bg-orange-800" textColor="text-white">
                            <FontAwesomeIcon icon={faWarning} />
                            <span>Variable shipping availability</span>
                          </Warning>
                        </Tooltip>
                      </div>
                    )
                  }
                  {
                    (!isAccurate) && (
                      <div className="relative">
                        <Tooltip info="Unable to verify results" className="text-black" fullWidth>
                          <Warning>
                            <FontAwesomeIcon icon={faWarning} />
                            <span>Possibly inaccurate</span>
                          </Warning>
                        </Tooltip>
                      </div>
                    )
                  }
                  {
                    shopInfo.bootlegWarning && (
                      <div className="relative">
                        <Tooltip info="Shop is known to occasionally sell or list counterfeit items" className="text-black" fullWidth>
                          <Warning>
                            <FontAwesomeIcon icon={faWarning} />
                            <span>May include bootlegs</span>
                          </Warning>
                        </Tooltip>
                      </div>
                    )
                  }
                  {
                    shopInfo.exchangeRatesWarning && (
                      <div className="relative">
                        <Tooltip info={`In-shop prices will be higher with currencies other than ${shopInfo.currency}`} fullWidth>
                          <Warning bgColor="bg-amber-600" textColor="text-white">
                            <FontAwesomeIcon icon={faMoneyBillTrendUp} />
                            <span>Inflated exchange rates</span>
                          </Warning>
                        </Tooltip>
                      </div>
                    )
                  }
                  {
                    shopInfo.locationPriceWarning && (
                      <div className="relative">
                        <Tooltip info="In-shop prices can differ depending on your location" fullWidth>
                          <Warning bgColor="bg-purple-700" textColor="text-white">
                            <FontAwesomeIcon icon={faMoneyBillTrendUp} />
                            <span>Variable prices</span>
                          </Warning>
                        </Tooltip>
                      </div>
                    )
                  }
                  {
                    !!shopInfo.siteIsBrokenNotice && (
                      <div className="relative">
                        <Tooltip info={shopInfo.siteIsBrokenNotice} fullWidth>
                          <Warning bgColor="bg-slate-600" textColor="text-white">
                            <FontAwesomeIcon icon={faInfoCircle} />
                            <span>Broken website</span>
                          </Warning>
                        </Tooltip>
                      </div>
                    )
                  }
                  {
                    (shopInfo.accountWarning && figure?.name.includes('NSFW')) && (
                      <div className="relative">
                        <Tooltip info="An account on the shop's website is needed to see the product page" fullWidth>
                          <Warning bgColor="bg-emerald-700" textColor="text-white">
                            <FontAwesomeIcon icon={faUser} />
                            <span>Shop requires account</span>
                          </Warning>
                        </Tooltip>
                      </div>
                    )
                  }
                  {
                    shopInfo.inStockWishlistWarning && (
                      <div className="relative">
                        <Tooltip info="Available for backorder via wishlist if shown as unavailable on the product page" fullWidth>
                          <Warning bgColor="bg-red-700" textColor="text-white">
                            <FontAwesomeIcon icon={faHeartCirclePlus} />
                            <span>Wishlist backorder</span>
                          </Warning>
                        </Tooltip>
                      </div>
                    )
                  }
                  {
                    shopInfo.stockStatusWarning && (
                      <div className="relative">
                        <Tooltip info="Unable to verify the actual stock status of the item" fullWidth>
                          <Warning bgColor="bg-red-700" textColor="text-white">
                            <FontAwesomeIcon icon={faBoxesStacked} />
                            <span>Unknown stock status</span>
                          </Warning>
                        </Tooltip>
                      </div>
                    )
                  }
                </div>
              )
            }
            <div className="relative flex flex-col rounded-lg shadow-lg bg-zinc-50/75 dark:bg-zinc-800">
              <a
                className={`flex justify-between rounded-lg shadow-md transition-colors ${isAffiliate ? 'bg-slate-200 dark:bg-gray-700' : 'bg-white dark:bg-zinc-700'} hover:no-underline hover:bg-slate-200 hover:dark:bg-gray-600 text-xl`}
                href={url}
                target="_blank"
                rel="nofollow noreferrer"
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center ml-3 mr-2 my-2 gap-2 text-zinc-900 dark:text-zinc-100">
                  <div className="flex flex-row flex-wrap items-center gap-2">
                    <div className="flex items-center">
                      {
                        (!!Flag && !!countryName) && (
                          <p className="mr-2">
                            <Flag title={countryName} className="inline-block h-3 border border-zinc-800 rounded-sm" />
                          </p>
                        )
                      }
                      <span>
                        {shopInfo.name}
                      </span>
                      {
                        isAffiliate && (
                          <div className="relative flex items-center ml-2 text-sm text-sky-600 dark:text-sky-500">
                            <Tooltip info="Affiliate" fullWidth>
                              <FontAwesomeIcon icon={faSun} />
                            </Tooltip>
                          </div>
                        )
                      }
                    </div>
                    {
                      isLoading ? (
                        <LoadingSpinner />
                      ) : (
                        <LastChecked />
                      )
                    }
                  </div>
                </div>
                <div className="flex justify-end items-center ml-2 mr-3 my-2 text-black dark:text-white">
                  { 
                    listings.length === 1 && (
                      <p className="mx-2">
                        <Tag text={listings[0].condition === 'used' ? 'Used' : 'New'} bgColor={listings[0].condition === 'used' ? 'bg-yellow-700' : 'bg-sky-700'} />
                      </p>
                    )
                  }
                  <div>
                    {
                      listings.length > 1 && (
                        <span className="mr-2">
                          {listings.length} hits from
                        </span>
                      )
                    }
                    {
                      !!firstListingWithPrice ? (
                          <span className="font-bold">
                            <PriceDisplay price={firstListingWithPrice.price} currencyFrom={firstListingWithPrice.currency} />
                          </span>
                      ) : (
                        <span className="italic text-base text-zinc-600 dark:text-zinc-400">
                          No price
                        </span>
                      )
                    }
                  </div>
                  {
                    (!hasFigureListings || shopInfo.reportShopOnly) && (
                      <>
                        {
                          session?.user.admin ? (
                            <p className="ml-2 text-red-600 cursor-pointer" title="Remove a wrong listing" onClick={(e) => removeListing(e, 0)}>
                              <FontAwesomeIcon icon={faTimes} />
                            </p>
                          ) : (
                            <p className="ml-2 text-red-600 cursor-pointer" title="Report a wrong result" onClick={(e) => report(e, 0)}>
                              <FontAwesomeIcon icon={faFlag} />
                            </p>
                          )
                        }
                      </>
                    )
                  }
                </div>
              </a>
              {
                hasFigureListings && (
                  <>
                    <div className="flex flex-col divide-y divide-zinc-400 dark:divide-zinc-700">
                      {
                        listings.map((listing, index) => (
                          <FigureListing
                            key={listing._id.toString() || listing.id}
                            listing={listing}
                            displayTag={listings.length > 1}
                            country={countryName}
                            isHidden={index > 1 && !showAllListings}
                            displayReport={!shopInfo.reportShopOnly}
                            report={(e) => report(e, index)}
                            remove={(e) => removeListing(e, index)}
                          />
                        ))
                      }
                      {
                        listings.length > 2 && (
                          <div className="mb-2">
                            <p
                              className="block justify-between mx-2 mt-2 px-2 py-1 text-center text-slate-800 dark:text-slate-200 rounded-md hover:no-underline transition-colors hover:bg-gray-300 hover:dark:bg-gray-600 cursor-pointer"
                              onClick={(e) => toggleShowAllListings(e)}
                            >
                              <small className="mr-4 text-sm">
                                {showAllListings ? 'Hide listings' : 'Show more listings'}
                              </small>
                              <FontAwesomeIcon icon={showAllListings ? faChevronUp : faChevronDown} />
                            </p>
                          </div>
                        )
                      }
                    </div>
                  </>
                )
              }
            </div>
          </div>
        )
      }
      {
        !listings && shop && (
          <div className="relative my-2 hover:no-underline">
            {
              shopInfo.nsfwBlock && (
                  <div className="flex px-2 gap-2">
                    <div className="relative">
                      <Tooltip info="The site hides NSFW listings and cannot be searched" fullWidth>
                        <Warning bgColor="bg-red-700" textColor="text-white">
                          <FontAwesomeIcon icon={faBan} />
                          <span>Hidden NSFW</span>
                        </Warning>
                      </Tooltip>
                    </div>
                  </div>
              )
            }
            <div className="flex justify-between px-3 py-2 rounded-lg shadow-sm bg-zinc-200 dark:bg-zinc-800 text-xl">
              <h3 className="text-zinc-500 dark:text-zinc-500">
                <div className="flex flex-wrap items-center gap-2">
                  <p>
                    {shopInfo.name}
                  </p>
                  {
                    isLoading ? (
                      <LoadingSpinner />
                    ) : (
                      <LastChecked />
                    )
                  }
                </div>
              </h3>
              <div className="flex">
                <h3 className="text-zinc-400 dark:text-zinc-600">No hits</h3>
                {
                  (!session?.user.admin) && (
                    <p className="ml-2 text-red-600 cursor-pointer" title="Report a missing result" onClick={() => setShowReportModal(true)}>
                      <FontAwesomeIcon icon={faFlag} />
                    </p>
                  )
                }
              </div>
            </div>
          </div>
        )
      }
      {
        showReportModal && (
          <Modal title={flaggedListingIndex ? 'Report a wrong result' : 'Report a missing result'} onClose={() => setShowReportModal(false)}>
            <ReportForm
              type={flaggedListingIndex !== null ? 'falsePositive' : 'falseNegative'}
              listing={flaggedListingIndex !== null && listings ? listings[flaggedListingIndex] : undefined}
              figureId={figure ? figure._id.toString() : undefined}
              shop={shop}
              canRefresh={canRefresh}
              close={() => setShowReportModal(false)}
            />
          </Modal>
        )
      }
    </>
  )
}