import Listings from "../models/Listing"
import Prices from "../models/Price"
import { UnparsedListing } from "../../crawler/utils"
import { shops } from "../../data/shops"
import { Figure } from "../../types/Figure"
import { Listing } from "../../types/Listing"
import getCurrency from "./getCurrency"
import checkListingForAvailability from "./checkListingForAvailability"
import figureReleaseDate from "./figureReleaseDateForComparison"
import getPriceValueFromString from "./getPriceValueFromString"
import { Shop } from "../../types/Shops"
import getExchangeRates from "./getExchangeRates"
import PricePoints from "../models/PricePoint"

async function checkForBootlegs (figure: Figure, shop: Shop, listingData: any) {
  if (!shop.checkForBootlegs) return false

  let basePrice = figure.priceData?.averagePrice
  let baseCurrency = 'JPY'

  if (!basePrice) {
    const lastRelease = figure.releases.find(release => !!release.price)

    if (!lastRelease || !lastRelease.price) return false

    basePrice = lastRelease.price
    baseCurrency = lastRelease.currency?.toUpperCase() || baseCurrency
  }

  const exchangeRates = await getExchangeRates(baseCurrency)
  const convertedResultPrice = listingData.price / exchangeRates[listingData.currency.toUpperCase()]
  const isBootleg = convertedResultPrice <= basePrice / 4

  // if (isBootleg) {
  //   // console.log('Reference price:', basePrice)
  //   // console.log('Listing price:', convertedResultPrice)
  //   // console.log('Too much disparity, likely bootleg or wrong item. Listing:', listingData)
  // }

  return isBootleg
}

export default async function parseListingsResults (figure: Figure, shop: string, results: UnparsedListing[]) {
  const shopInfo = shops[shop]

  const listingsMap = new Map()

  let listings: Listing[] = []

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
        
    if (shopInfo.mirrorShop && !!shopInfo.itemIdRegex && !!shopInfo.replaceUrl) {
      const itemId = (shopInfo.itemIdRegex.exec(result.url) || [])[1]

      if (itemId) result.url = shopInfo.replaceUrl + itemId
    }

    const price = getPriceValueFromString(result.price)

    if (!price) {
      // console.log(`No price found in listing ${result.title} for figure ${figure._id.toString()}, skipping.`)

      continue
    }

    const listingData = {
      figure: figure._id,
      title: result.title,
      shop,
      price,
      currency: getCurrency(result.price, result.currency),
      condition: result.condition,
      seller: result.seller,
      isDomesticShippingOnly: result.isDomesticShippingOnly,
      url: result.url,
      priceIsTBD: result.priceIsTBD,
      isAccurate: result.isAccurate,
      lastCheck: new Date()
    }

    const earliestReleaseDate = figure.releases.filter(release => !!release.date).map(release => release.date).sort()[0]

    if (earliestReleaseDate && listingData.condition === 'used') {
      const releaseTime = figureReleaseDate(earliestReleaseDate).getTime()
      const now = Date.now()

      if (releaseTime > now) {
        // console.log(`Figure ${figure._id.toString()} hasn't been released yet but listing is marked as used, skipping.`)

        continue
      }
    }

    if (await checkForBootlegs(figure, shopInfo, listingData)) continue

    let listing = await Listings.findOne({ figure: figure._id, url: result.url, seller: result.seller, condition: result.condition })

    if (listing) {
      Object.assign(listing, listingData)

      await listing.save()
    } else {
      listing = await Listings.create(listingData)
    }

    if ((!shopInfo.checkExistingListings || shopInfo.checkIfSoldOut) && shopInfo.checkSoldOutSelectors && shopInfo.checkSoldOutSelectors.length) {
      const checkedListing = await checkListingForAvailability(listing, shop)

      if (checkedListing) {
        listing = checkedListing
      } else {
        // console.log('Figure', figure._id.toString(), 'is not available in shop', shop)

        continue
      }
    } else if (!listing.priceIsTBD) {
      await Prices.create({ listing: listing._id, price: listing.price, currency: listing.currency.toUpperCase() })

      const nowDate = new Date()
      const nowYear = nowDate.getUTCFullYear()
      const nowMonth = nowDate.getUTCMonth()

      await PricePoints.deleteMany({
        figure: figure._id,
        yearMonth: `${nowYear}/${nowMonth}`
      })
    }

    if (!listing) continue

    const key = `${listing.url}-${listing.seller}-${listing.condition}`

    if (listingsMap.has(key)) {
      const prevListing = listingsMap.get(key)

      if (listing.condition === 'new' && shopInfo.ignoreNewIfLessExpensive ? prevListing.price > listing.price : prevListing.price < listing.price) continue
    }

    listingsMap.set(key, listing)
  }

  listings = [...listingsMap.values()]

  if (shopInfo.ignoreUsedIfMoreExpensive) {
    const newListings = listings.filter(listing => listing.condition === 'new')

    if (newListings.length < listings.length) {
      const lowestNewPrice = newListings.reduce((lowestPrice, currListing) => lowestPrice === 0 || currListing.price < lowestPrice ? currListing.price : lowestPrice, 0)
      
      if (lowestNewPrice > 0) {
        listings = listings.filter(listing => listing.condition === 'new' || listing.price < lowestNewPrice)
      }
    }
  }

  // console.log(listings.length, 'listings has been parsed for figure', figure._id.toString(), 'in shop', shop)

  return listings
}
