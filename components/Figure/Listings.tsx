import { useRouter } from "next/router"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useCurrency } from "../../store/CurrencyContext"
import { useShops } from "../../store/ShopsContext"
import { useLoading } from "../../store/LoadingContext"
import { useToast } from "../../store/ToastContext"
import { ListingsByShop } from "../../types/Listing"
import { shops } from "../../data/shopsClient"
import convertPrice from "../../mixins/convertPrice"
import LoadingSpinner from "../_utils/LoadingSpinner"
import ShopListing from "./ShopListing"
import { Figure } from "../../types/Figure"
import Toolbar from "./Toolbar"
import { Types } from "mongoose"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faMagnifyingGlass, faRefresh } from "@fortawesome/free-solid-svg-icons"
import Tooltip from "../_utils/Tooltip"
import Notice from "../_utils/Notice"
import { useSession } from "next-auth/react"
import Button from "../_utils/Button"
import { barcodeRegex } from "../../mixins/barcodeRegex"
import UnsearchableShop from "./UnsearchableShop"

interface ShopResults {
  figure: Types.ObjectId
  results: ListingsByShop
}

const sortPrice = (priceA: number, priceB: number) => priceA === 0 || priceB === 0 ? priceB - priceA : priceA - priceB

export default function Listings ({
  figure,
  cachedSortedListingsByShops = [],
  title,
  exchangeRates
}: {
  figure: Figure,
  cachedSortedListingsByShops: ListingsByShop[],
  title: string,
  exchangeRates: { [key: string]: number }
}) {
  const { data: session } = useSession()
  // const cachedListingsByShops = useMemo(() => cachedSortedListingsByShops.filter(([shop, listings]) => !!listings.length), [JSON.stringify(cachedSortedListingsByShops)])
  const router = useRouter()
  const { currency } = useCurrency()
  const { disabledShops, userDisabledShopsHaveLoaded } = useShops()
  const { updateLoading } = useLoading()
  const { updateToast } = useToast()
  const [serverIsUnderLoad, setServerIsUnderLoad] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [listingsByShops, setListingsByShops] = useState<ListingsByShop[]>(cachedSortedListingsByShops)
  const [shopsToRefresh, setShopsToRefresh] = useState<string[]>([])
  const [loadingShops, setLoadingShops] = useState<[string, AbortController][]>([])
  const [conditions, setConditions] = useState(['new', 'used'])

  const enabledShops = Object.keys(shops).filter(shop => !disabledShops.includes(shop))
  const [searchableShops, unsearchableShops] = useMemo(() => {
    const sortedShops: [string[], string[]] = [[], []]

    for (let i = 0; i < enabledShops.length; i++) {
      const shop = enabledShops[i]
      
      !barcodeRegex.test(figure.name) || shops[shop].searchByJAN ?
        sortedShops[0].push(shop) :
        sortedShops[1].push(shop)
    }

    return sortedShops
  }, [JSON.stringify(enabledShops)])
  const filteredListingsByShop = useMemo(() => {
    return listingsByShops
      .map(([shop, listings, nextSearch, lastSearch]) => {
        const newListingsByShop: ListingsByShop = [shop, listings.filter(listing => conditions.includes(listing.condition)), nextSearch, lastSearch]

        return newListingsByShop
      })
  }, [JSON.stringify(listingsByShops), JSON.stringify(conditions)])
  const sortedListingsByShop = useMemo(() => {
    return filteredListingsByShop
      .filter(([shop, listings]) => searchableShops.includes(shop) && listings.length)
      .sort(([shopA, [firstAListing]], [shopB, [firstBListing]]) => {
        const priceA = firstAListing.price / exchangeRates[firstAListing.currency.toUpperCase()]
        const priceB = firstBListing.price / exchangeRates[firstBListing.currency.toUpperCase()]

        return sortPrice(priceA, priceB)
      })
  }, [JSON.stringify(filteredListingsByShop), JSON.stringify(searchableShops)])
  const noHitShops = useMemo(() => {
    return filteredListingsByShop
      .filter(([shop, listings]) => searchableShops.includes(shop) && !listings.length)
      .sort(([shopA], [shopB]) => shopA > shopB ? 1 : -1)
  }, [JSON.stringify(filteredListingsByShop), JSON.stringify(searchableShops)])
  const shopsToCheck = useMemo(() => searchableShops.filter(shop => {
    return (
      (shopsToRefresh.includes(shop) || !listingsByShops.map(([shop]) => shop).includes(shop)) &&
      !loadingShops.map(([loadingShop]) => loadingShop).includes(shop)
    )
  }), [JSON.stringify(searchableShops), JSON.stringify(sortedListingsByShop), JSON.stringify(loadingShops), JSON.stringify(shopsToRefresh)])
  const nextShopToCheck = shopsToCheck[0] || null
  const now = Date.now()
  const canRefreshShops = listingsByShops.filter(([shop, listings, nextSearch]) => {
    return (session?.user.admin || nextSearch === undefined || (nextSearch !== null && nextSearch <= now)) && searchableShops.includes(shop) && !loadingShops.map(([loadingShop]) => loadingShop).includes(shop)
  }).map(([shop]) => shop)

  const toggleCondition = (condition: 'new' | 'used') => {
    setConditions(prevConditions => prevConditions.includes(condition) ? prevConditions.filter(prevCondition => condition !== prevCondition) : [...prevConditions, condition])
  }

  const getShopListings = useCallback(async () => {
    if (nextShopToCheck === null || loadingShops.length > 5) return

    const currShop = nextShopToCheck
    const controller = new AbortController
    const signal = controller.signal

    setLoadingShops(prevLoadingShops => [...prevLoadingShops, [currShop, controller]])

    try {
      const res = await fetch(`/api/listings/?shop=${currShop}&_id=${figure._id.toString()}`, { signal })
      const shopResultsJson = await res.json() as ShopResults

      if (shopResultsJson.figure !== figure._id) return

      const newListingsByShop: ListingsByShop = shopResultsJson.results

      newListingsByShop[1] = newListingsByShop[1].map(listing => ({ ...listing, title: listing.title || title }))
        .sort((listingA, listingB) => {
          const priceA: number = convertPrice(listingA.price, listingA.currency, currency) || listingA.price
          const priceB: number = convertPrice(listingB.price, listingB.currency, currency) || listingB.price

          return sortPrice(priceA, priceB)
        })

      setListingsByShops((prevListingsByShops) => {
        const prevIndex = prevListingsByShops.map(([shop]) => shop).indexOf(currShop)

        if (prevIndex >= 0) return [...prevListingsByShops.slice(0, prevIndex), newListingsByShop, ...prevListingsByShops.slice(prevIndex + 1)]

        return [
          ...prevListingsByShops,
          newListingsByShop
        ]
      })
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Fetching aborted.')
      } else {
        console.error(`Listings for ${shops[currShop].name} couldn't be retrieved. Trying again...`)
      }
    }

    setLoadingShops(prevLoadingShops => prevLoadingShops.filter(([prevShop]) => currShop !== prevShop))
    setShopsToRefresh(prevShopsToRefresh => prevShopsToRefresh.filter(prevShop => currShop !== prevShop))
  }, [
    nextShopToCheck,
    JSON.stringify(listingsByShops),
    JSON.stringify(loadingShops),
    JSON.stringify(noHitShops),
    JSON.stringify(shopsToRefresh),
    userDisabledShopsHaveLoaded
  ])

  async function refresh (shop: string) {
    try {
      if (session?.user.admin) {
        const res = await fetch(`/api/listings/deleteCache?shop=${shop}&_id=${figure._id.toString()}`)
  
        if (!res.ok) throw new Error('Couldn\'t delete cache')
      }

      setShopsToRefresh(prev => [...prev, shop])
      setIsSearching(true)
    } catch (error) {
      updateToast(`Listings for ${shops[shop].name} couldn't be refreshed.`, 'error')
    }
  }

  async function removeListing (index: number, shop: string) {
    const [listingsShop, listings] = listingsByShops.filter(([listingsShop]) => listingsShop === shop)[0]
    const listing = listings[index]

    try {
      const res = await fetch('/api/listings/setValidity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: listing._id.toString(),
          isWrong: true
        })
      })
      
      if (res.ok) {
        setListingsByShops(prev => {
          return prev.map(([listingsShop, prevListings, nextSearch]: ListingsByShop) => {
            return [
              listingsShop,
              prevListings.filter(prevListing => prevListing._id.toString() !== listing._id.toString()),
              nextSearch
            ] as ListingsByShop
          })
        })
      }
    } catch (error) {
      updateToast(`Listing couldn't be removed.`, 'error')
    }
  }

  async function getCurrentServerLoad () {
    try {
      const res = await fetch('/api/queues/load')

      if (res.ok) {
        const load = await res.json() as boolean

        setServerIsUnderLoad(load)
      }
    } catch (error) {
      console.error('Couldn\'t get current server load.')
    }
  }

  useEffect(() => {
    if (nextShopToCheck === null && loadingShops.length === 0) setIsSearching(false)
  }, [nextShopToCheck, loadingShops.length])

  useEffect(() => {
    getCurrentServerLoad()

    if (!figure) updateToast('Couldn\'t retrieve the figure\'s info.', 'error')

    updateLoading(false)

    for (let i = 0; i < loadingShops.length; i++) {
      const [shop, controller] = loadingShops[i]

      controller.abort()
    }

    setListingsByShops(cachedSortedListingsByShops)
    setLoadingShops([])

    return () => {
      for (let i = 0; i < loadingShops.length; i++) {
        const [shop, controller] = loadingShops[i]

        controller.abort()
      }

      setLoadingShops([])
    }
  }, [router.query._id])

  useEffect(() => {
    const latestFigure: string = router.query._id as string
    const searchHistory: string[] = JSON.parse(localStorage.getItem('searchHistory') || '[]').filter((lastFigure: string) => lastFigure !== latestFigure).slice(0, 4)

    localStorage.setItem('searchHistory', JSON.stringify([latestFigure, ...searchHistory]))
  }, [router.query._id])

  useEffect(() => {
    if (!userDisabledShopsHaveLoaded) return
    if (!isSearching) return

    getShopListings()
  }, [isSearching, nextShopToCheck, JSON.stringify(loadingShops), JSON.stringify(shopsToRefresh), userDisabledShopsHaveLoaded])

  useEffect(() => {
    setLoadingShops(prevLoadingShops => prevLoadingShops.filter(([shop]) => !disabledShops.includes(shop)))
  }, [JSON.stringify(disabledShops)])

  return (
    <>
      <Toolbar figure={figure} conditions={conditions} toggleCondition={(value) => toggleCondition(value)} />
      <div className="flex flex-col mt-2">
        {
          ((shopsToCheck.length > 0 || loadingShops.length > 0) && serverIsUnderLoad) && (
            <Notice type="warning" fullWidth>
              The server is currently under heavy load, searches might take a while to complete or even fail. <br />
              Consider starting a search later.
            </Notice>
          )
        }
        {
          (!isSearching && shopsToCheck.length > 0) && (
            <div className="mx-auto my-4 rounded-lg shadow-lg">
              <button
                className="relative group rounded-lg px-3 py-2 transition-all text-white hover:text-black bg-indigo-500 shadow-[inset_0_80px_80px_-40px_#10b981] hover:bg-white hover:shadow-[inset_0_80px_60px_-30px_#c7d2fe]"
                onClick={() => setIsSearching(true)}
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                <span className="ml-2">
                  Start searching through {shopsToCheck.length} shop{shopsToCheck.length > 1 && 's'}
                </span>
                <div className="text-xs transition-colors text-sky-200 group-hover:text-zinc-600 mt-1">
                  { shopsToCheck.slice(0, 3).map(shop => shops[shop].name).join(', ') }
                  {
                    shopsToCheck.length > 3 && (
                      <div className="flex justify-center items-center gap-1">
                        <span>and</span>
                        <Tooltip info={shopsToCheck.slice(3).map(shop => shops[shop].name).join(', ')}>{shopsToCheck.slice(3).length} other{shopsToCheck.length > 1 ? 's' : ''}</Tooltip>
                      </div>
                    )
                  }
                </div>
              </button>
            </div>
          )
        }
        {
          (isSearching && loadingShops.length > 0) && (
            <div className="flex flex-col px-3 py-2 my-2 rounded-lg shadow-sm bg-zinc-50 dark:bg-zinc-800">
              <p className="flex justify-center">
                <LoadingSpinner />
                <span className="ml-4 text-lg">
                  Fetching listings, this could take a few minutes... ({sortedListingsByShop.length + noHitShops.length - shopsToRefresh.length} / {searchableShops.length})
                </span>
              </p>
              <small className="text-zinc-600 dark:text-zinc-400 text-center">
                Currently searching: {loadingShops.map(([shop]) => shops[shop].name).join(', ')}
              </small>
            </div>
          )
        }
        {
          !!canRefreshShops.length && (
            <div className="flex justify-start mb-2">
              <Button action={() => canRefreshShops.forEach(shop => refresh(shop))}>
                <FontAwesomeIcon icon={faRefresh} />
                <span className="ml-2">Refresh all</span>
              </Button>
            </div>
          )
        }
        {
          sortedListingsByShop.map(([shop, listings, nextSearch, lastSearch]) => (
            <ShopListing
              key={shop}
              listings={listings}
              figure={figure}
              shop={shop}
              lastSearch={lastSearch}
              isLoading={loadingShops.map(([loadingShop]) => loadingShop).includes(shop)}
              canRefresh={canRefreshShops.includes(shop)}
              refresh={() => refresh(shop)}
              remove={(index: number) => removeListing(index, shop)}
            />
          ))
        }
        {
          (!!sortedListingsByShop.length && !!noHitShops.length) && (
            <hr className="my-4 border-zinc-400 dark:border-zinc-600" />
          )
        }
        {
          noHitShops.map(([shop, listings, nextSearch, lastSearch]) => (
            <ShopListing
              key={shop}
              listings={null}
              figure={figure}
              shop={shop}
              lastSearch={lastSearch}
              isLoading={shopsToRefresh.includes(shop) || loadingShops.map(([loadingShop]) => loadingShop).includes(shop)}
              canRefresh={canRefreshShops.includes(shop)}
              refresh={() => refresh(shop)}
            />
          ))
        }
        {
          unsearchableShops.map((shop) => (
            <UnsearchableShop
              key={shop}
              shop={shop}
            />
          ))
        }
      </div>
    </>
  )
}
