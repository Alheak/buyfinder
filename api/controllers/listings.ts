import { Types } from "mongoose"
import { getFigure } from './figures'
import connectDB from '../utils/connectDB'
import { shops } from '../../data/shops'
import checkListingsForWatches from '../utils/checkListingsForWatches'
import getExchangeRates from '../utils/getExchangeRates'
import shopCanBeSearched from '../utils/shopCanBeSearched'
import getListingCacheExpirationTime from '../utils/getListingCacheExpirationTime'
import Listings from '../models/Listing'
import Reports from '../models/Report'
import Figures from '../models/Figure'
import ShopSearches from '../models/ShopSearch'
import redis from '../utils/redisClient'
import getListingsHelper from '../utils/getListings'
import { getSearches } from "../../crawler/utils"
import { nanoid } from 'nanoid'
import { User } from '../../types/User'
import { SearchLanguages } from "../../types/Shops"
import type { Figure } from '../../types/Figure'
import type { Listing, ListingsByShop } from '../../types/Listing'
import Prices from "../models/Price"
import PricePoint from "../models/PricePoint"
import NoHits from "../models/NoHit"

connectDB()

const sortPrice = (priceA: number, priceB: number) => {
  return priceA === 0 || priceB === 0 ? priceB - priceA : priceA - priceB
}

export async function getCachedListings(_id: string) {
  // return []

  try {
    const listingsByShops: ListingsByShop[] = []

    let key = ''

    for (let i = 0; i < Object.keys(shops).length; i++) {
      const shop = Object.keys(shops)[i]

      key = `listings_${_id}_${shop}`

      if (!(await redis.exists(key))) continue

      const exchangeRates = await getExchangeRates()
      const cachedListings = (JSON.parse(await redis.get(key) || '{ "listings": [] }'))
      const listings = ((cachedListings.listings === undefined ? cachedListings : cachedListings.listings) as Listing[])
        .sort(({ price: priceA, currency: currencyA }, { price: priceB, currency: currencyB }) => {
          const convertedPriceA = priceA / exchangeRates[currencyA.toUpperCase()]
          const convertedPriceB = priceB / exchangeRates[currencyB.toUpperCase()]

          return sortPrice(convertedPriceA, convertedPriceB)
        })
      const nextSearch = cachedListings.nextSearch === null ? null : cachedListings.nextSearch || (Date.now() + (await redis.ttl(key) || 0) * 1000)
      const lastSearch = cachedListings.lastSearch
      const listingsByShop: ListingsByShop = [shop, listings, nextSearch, lastSearch]

      listingsByShops.push(listingsByShop)
    }

    return listingsByShops
  } catch (error) {
    console.error('Couldn\'t fetch cached listings for figure', _id, error)

    return []
  }
}

export async function deleteCache (_id: string, shop: string) {
  try {
    const key = `listings_${_id}_${shop}`

    await redis.del(key)

    await NoHits.deleteMany({ figure: new Types.ObjectId(_id), shop })
  } catch (error) {
    console.error('Couldn\'t delete cached listings for figure', _id, 'in shop', shop, error)

    throw new Error('Couldn\'t delete cached listings')
  }
}

export async function getListings(shop: string, _id: string, ip?: string, user?: User, testMode?: boolean): Promise<ListingsByShop> {
  if (!ip) ip = nanoid()

  const currentlySearchingKey = `currently_searching_for_listings_${_id}`

  await redis.incr(currentlySearchingKey)

  // console.log(await redis.get(currentlySearchingKey), 'shops are now currently being searched for figure', _id)

  const ipIsAlreadySearchingRedisKey = `searching_listings_ip_${ip}`

  let addedToList = false

  const figure: Figure = await getFigure(_id)

  _id = figure._id.toString()

  const key = `listings_${_id}_${shop}`
  
  let listings: Listing[] | null = []

  try {
    if (await redis.exists(key)) {
      const cachedListings = (JSON.parse(await redis.get(key) || '{ "listings": [] }'))
      const listings = (cachedListings.listings === undefined ? cachedListings : cachedListings.listings) as Listing[]
      const nextSearch = cachedListings.nextSearch === null ? null : (cachedListings.nextSearch || (Date.now() + (await redis.ttl(key) || 0) * 1000))
      const lastSearch = cachedListings.lastSearch
      const now = Date.now()

      if (nextSearch === null || (!!nextSearch && nextSearch > now)) return [shop, listings, nextSearch, lastSearch]
    }

    if (ip !== 'admin') {
      while (
        !user?.hasActiveSubscription &&
        (await redis.llen(ipIsAlreadySearchingRedisKey)) > 0 &&
        (await redis.lpos(ipIsAlreadySearchingRedisKey, _id)) === null
      ) {
        // console.log('IP', ip, 'is currently waiting for figure', _id, ', still searching', (await redis.llen(ipIsAlreadySearchingRedisKey)), 'shops:', (await redis.lrange(ipIsAlreadySearchingRedisKey, 0, -1)))

        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      await redis.rpush(ipIsAlreadySearchingRedisKey, _id)
      await redis.expire(ipIsAlreadySearchingRedisKey, 60 * 10, 'NX')
    }

    addedToList = true

    if (!(await shopCanBeSearched(figure, shop))) return [shop, [], null]

    listings = await getListingsHelper(figure, shop, undefined, undefined, undefined, testMode)

    // console.log(`Found listings for ${_id} in ${shop}:`, listings)

    const expirationTime = getListingCacheExpirationTime(shop)
    const lastSearch = Date.now()
    const nextSearch = lastSearch + 1000 * expirationTime

    await redis.set(key, JSON.stringify({
      listings: listings || [],
      nextSearch,
      lastSearch
    }))

    if (listings === null) return [shop, [], nextSearch, lastSearch]

    const listingsToCheckRedisKey = `listingsToCheckByShop_${_id}`
    const prevListingsByShop: { [key: string]: string[] } = JSON.parse(await redis.get(listingsToCheckRedisKey) || '{}')
    const shopListings = new Set([...(prevListingsByShop[shop] || []), ...listings.map((listing: Listing) => JSON.stringify(listing))])
    const allListingsByShop = {
      ...prevListingsByShop,
      [shop]: [...shopListings]
    }

    await redis.set(listingsToCheckRedisKey, JSON.stringify(allListingsByShop), 'EX', 60 * 10)

    // console.log(`${listings.length} listings added to the queue and will be checked in 5 minutes`)

    return [shop, listings, nextSearch, lastSearch]
  } catch (error) {
    console.error("Couldn't fetch listings for figure", _id, "in shop", shop, error)

    const expirationTime = getListingCacheExpirationTime(shop)
    const lastSearch = Date.now()
    const nextSearch = lastSearch + 1000 * expirationTime

    await redis.set(key, JSON.stringify({
      listings,
      nextSearch,
      lastSearch
    }))

    return [shop, [], null]
  } finally {
    setTimeout(() => {
      checkListingsForWatches(_id)
    }, 1000 * 60)

    if (addedToList) await redis.lrem(ipIsAlreadySearchingRedisKey, 1, _id)

    await redis.decr(currentlySearchingKey)

    // console.log(await redis.get(currentlySearchingKey), 'shops are now currently being searched for figure', _id)
  }
}

export async function getListingsToCheck (_id: string) {
  try {
    const figure = await getFigure(_id)
    const reports = await Reports.find({
      figure: figure._id,
      $and: [
        { listing: { $exists: true } },
        { listing: { $ne: null } }
      ],
      isConfirmed: { $exists: true }
    }).populate('listing')
    const listings: Listing[] = await Listings.find({
      url: { $nin: reports.filter(report => !!report.listing).map(report => report.listing.url) },
      figure: figure._id,
      isWrong: { $exists: false }
    }).sort({ createdAt: -1 })
      .limit(20)
      .populate('figure')

    return listings
  } catch (error) {
    console.error('Something went wrong trying to get a listing to check', error)

    throw new Error('Something went wrong trying to get a listing to check')
  }
}

export async function getCheckedListings (_id: string) {
  try {
    const figure = await getFigure(_id)
    const reports = await Reports.find({
      figure: figure._id,
      $and: [
        { listing: { $exists: true } },
        { listing: { $ne: null } }
      ],
      isConfirmed: { $exists: true }
    }).populate('listing')
    const listings: Listing[] = await Listings.find({
      url: { $nin: reports.map(report => report.listing.url) },
      figure: figure._id,
      isWrong: { $exists: true }
    }).sort({ updatedAt: -1 })
      .limit(20)
      .populate('figure')

    return listings
  } catch (error) {
    console.error('Something went wrong trying to get a listing to check', error)

    throw new Error('Something went wrong trying to get a listing to check')
  }
}

export async function setListingValidity (_id: string, isWrong: boolean) {
  try {
    const listing = await Listings.findById(_id)

    listing.isWrong = isWrong

    await listing.save()

    if (listing.isWrong) {
      await redis.del(`listings_${listing.figure.toString()}_${listing.shop}`)

      const prices = await Prices.find({
        listing: listing._id
      })
      const yearMonthsSet = new Set()

      for (let i = 0; i < prices.length; i++) {
        const price = prices[i]
        const priceYear = price.updatedAt.getUTCFullYear()
        const priceMonth = price.updatedAt.getUTCMonth() + 1
        const yearMonth = `${priceYear}/${priceMonth}`

        yearMonthsSet.add(yearMonth)
      }

      await PricePoint.deleteMany({
        figure: listing.figure,
        yearMonth: { $in: [...yearMonthsSet] }
      })
    }

    return listing
  } catch (error) {
    console.error('Something went wrong trying to set the listing\'s validity', error)

    throw new Error('Something went wrong trying to set the listing\'s validity')
  }
}

export async function createListing (data: {
  figureId: string,
  title: string,
  shop: string,
  price: number,
  currency: string,
  condition: 'new' | 'used',
  url: string
}) {
  try {
    const listingData: any = {
      ...data,
      figure: new Types.ObjectId(data.figureId)
    }

    delete listingData.figureId

    const listing = await Listings.create(listingData)

    return listing
  } catch (error) {
    console.error('Something went wrong trying to create the listing', error)

    throw new Error('Something went wrong trying to create the listing')
  }
}

export async function getListingSearches (shop: string, _id: string) {
  try {
    const shopInfo = shops[shop]
    const figure = await Figures.findById(_id)
    const shopSearches = await ShopSearches.find({
      shop,
      figure: figure._id
    })
    const termsData = shopInfo.termsLang && figure[shopInfo.termsLang as SearchLanguages] ? figure[shopInfo.termsLang as SearchLanguages] : figure

    return shopSearches.length
      ? shopSearches.map(shopSearch => shopSearch.search)
      : await getSearches(termsData, shopInfo.searchTerms.filter(searchTerm => searchTerm !== 'jan'), figure, shopInfo, true)
  } catch (error) {
    console.error('Something went wrong trying to get the listing\'s searches', error)

    throw new Error('Something went wrong trying to get the listing\'s searches')
  }
}
