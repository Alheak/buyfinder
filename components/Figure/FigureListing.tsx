import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFlag, faInfoCircle, faTimes } from '@fortawesome/free-solid-svg-icons'
import { Listing } from '../../types/Listing'
import PriceDisplay from '../_utils/Price'
import Tag from '../_utils/Tag'
import { shops } from '../../data/shopsClient'
import React from 'react'
import { useSession } from 'next-auth/react'

export default function FigureListing (
  { listing, displayTag, displayShop, displayReport = true, country, isHidden, report, remove }: 
  { listing: Listing, displayTag?: boolean, displayShop?: boolean, displayReport?: boolean, country?: string | null, isHidden: boolean, report: (e: React.SyntheticEvent) => void, remove?: (e: React.SyntheticEvent) => void }
) {
  const { data: session } = useSession()
  const shopInfo = shops[listing.shop]
  const url = listing.url + (shopInfo && shopInfo.affiliateUrlAppend ? shopInfo.affiliateUrlAppend : '')

  return (
    <div className={`overflow-y-hidden transition-all duration-300 ${isHidden ? 'max-h-0 m-0 border-none' : 'max-h-screen mb-2'}`}>
      <a
        href={url}
        className="flex justify-between items-center mx-2 mt-2 px-2 py-1 rounded-md hover:no-underline transition-colors hover:bg-gray-300 hover:dark:bg-gray-600"
        target="_blank"
        rel="nofollow noreferrer"
      >
        <p>
          {
            !!displayShop && (
              <strong className="mr-2 px-1 rounded-sm text-white dark:text-zinc-900 bg-slate-700 dark:bg-slate-300">{shopInfo.name}</strong>
            )
          }
          <small className="italic text-sm text-slate-600 dark:text-slate-400">
            {listing.title}
          </small>
        </p>
        {
          (listing.isDomesticShippingOnly && !!country) && (
            <div className="ml-2">
              <p className="text-sm text-sky-500">
                <FontAwesomeIcon icon={faInfoCircle} />
                <span className="ml-2">Only ships within {country}</span>
              </p>
            </div>
          )
        }
        {
          displayTag && (
            <div className="grow flex justify-end items-center">
              <p className="mx-2">
                <Tag text={listing.condition === 'used' ? 'Used' : 'New'} bgColor={listing.condition === 'used' ? 'bg-yellow-700' : 'bg-sky-700'} />
              </p>
              <p className="whitespace-nowrap font-bold text-black dark:text-white">
                {
                  !!listing.price && !listing.priceIsTBD ? (
                    <PriceDisplay price={listing.price} currencyFrom={listing.currency} />
                  ) : (
                    <span className="italic text-sm text-zinc-500">
                      No price
                    </span>
                  )
                }
              </p>
            </div>
          )
        }
        {
          displayReport && (
            <>
              {
                (session?.user.admin && !!remove) && (
                  <p className="ml-2 text-red-600 cursor-pointer" title="Remove a wrong listing" onClick={remove}>
                    <FontAwesomeIcon icon={faTimes} />
                  </p>
                )
              }
              {
                (!session?.user.admin) && (
                  <p className="ml-2 text-red-600 cursor-pointer" title="Report a wrong result" onClick={report}>
                    <FontAwesomeIcon icon={faFlag} />
                  </p>
                )
              }
            </>
          )
        }
      </a>
    </div>
  )
}