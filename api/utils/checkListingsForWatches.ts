import redis from '../utils/redisClient'
import getExchangeRates from './getExchangeRates'
import sendMail from "./sendMail"
import { shops } from "../../data/shops"
import { Listing } from "../../types/Listing"
import Watches from "../models/Watch"
import Figures from "../models/Figure"
import updateFigureCacheWithPriceData from './updateFigureCacheWithPriceData'
import Users from '../models/User'
import Listings from '../models/Listing'
import { Figure } from '../../types/Figure'

interface NewListing extends Listing {
  prevPrice: number
  prevCurrency: string
}

async function getNewPrices (watch: Omit<any, never>, matchingListings: Listing[]) {
  try {
    const exchangeRates: { [key: string]: number } = await getExchangeRates(watch.currency?.toUpperCase() || 'JPY')
    const prevListings: Listing[] = []

    for (let i = 0; i < watch.newListings.length; i++) {
      const prevListingId = watch.newListings[i]
      const listing = await Listings.findById(prevListingId)

      if (listing) prevListings.push(listing)
    }

    return matchingListings.filter(listing => {
      const prevListing = prevListings.find(prevListing => prevListing._id.toString() === listing._id.toString())

      if (!prevListing) return false

      const prevPrice = prevListing.price / exchangeRates[prevListing.currency.toUpperCase()]
      const currPrice = listing.price / exchangeRates[listing.currency.toUpperCase()]

      return Math.abs(100 - (prevPrice / currPrice * 100)) > 2
    }).map(listing => {
      const prevListing = prevListings.find(prevListing => prevListing._id.toString() === listing._id.toString())

      if (!prevListing) return listing

      return {
        ...listing,
        prevPrice: prevListing.price,
        prevCurrency: prevListing.currency
      }
    }) as NewListing[]
  } catch (error) {
    const user = await Users.findOne({ email: 'buyfinder.moe@gmail.com' })

    sendMail({
      subject: 'Error when trying to get new prices',
      text: `${error} ${watch} ${matchingListings}`,
      html: `${error} ${watch} ${matchingListings}`
    }, user)

    return []
  }
}

export async function checkForNewListings (watch: Omit<any, never>, listingsByShop: { [key: string]: Listing[] }, figure: Figure) {
  try {
    const exchangeRates: { [key: string]: number } = await getExchangeRates(watch.currency?.toUpperCase() || 'JPY')
    const searchedShops = Object.keys(listingsByShop).filter(shop => watch.shopsToSearch?.includes(shop))
    const uncheckedShopsListings = (watch.newListings || []).filter((listing: Listing) => !searchedShops.includes(listing.shop))
    const allListings = searchedShops
      .flatMap(shop => listingsByShop[shop])
    const matchingListings = allListings
      .filter(listing => {
        if (!listing) return false
        if (!watch.maximumPrice) return true

        const price = listing.price / exchangeRates[listing.currency.toUpperCase()]

        return typeof watch.maximumPrice === 'number' && price <= watch.maximumPrice
      })
      .sort((a, b) => (a.price / exchangeRates[a.currency.toUpperCase()]) - (b.price / exchangeRates[b.currency.toUpperCase()]))
    const newListings = matchingListings.filter(listing => !(watch.newListings || []).map((newListing: Listing) => newListing._id.toString()).includes(listing._id.toString()))
    const newPrices: NewListing[] = await getNewPrices(watch, matchingListings)

    if (!newListings.length && !newPrices.length) return

    // console.log(`${newListings.length} new listings and ${newPrices.length} new prices found for watch ID#${watch._id.toString()}`, newListings.map(listing => listing._id))

    try {
      const watchListings = ([...uncheckedShopsListings, ...matchingListings])
        .sort((a, b) => (a.price / exchangeRates[a.currency.toUpperCase()]) - (b.price / exchangeRates[b.currency.toUpperCase()]))
        .map((listing: Listing) => listing._id)

      watch.newListings = watchListings
      watch.lastFound = new Date()

      await watch.save()
    } catch (error) {
      console.error(`Error persisting new listings for watch ID#${watch._id.toString()}`, error)
    }

    const figureName = figure.name || figure._id.toString()
    const siteUrl = (process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL) || 'https://buyfinder.moe'
    const profileUrl = `${siteUrl}/profile/watches`
    const email = {
      subject: `buyfinder - New results have been found for ${figureName}`,
      text: `
        Hello,

        ${
          newListings.length > 0 ? `
            ${newListings.length > 1 ? 'Listings' : 'A listing'} for ${figureName} ${newListings.length > 1 ? 'have' : 'has'} been found:

            ${newListings.map(listing => `
              ${listing.title || figureName}
              ${(listing.price / exchangeRates[listing.currency.toUpperCase()]).toFixed(2)} ${watch.currency.toUpperCase()} on ${shops[listing.shop].name}
              ${listing.url}
            `).join('\n\n')}
          ` : ''
        }

        ${
          newPrices.length > 0 ? `
            ${newPrices.length > 1 ? 'Prices' : 'A price'} for ${figureName} ${newPrices.length > 1 ? 'have' : 'has'} changed:

            ${newPrices.map(listing => `
              ${listing.title || figureName} in ${shops[listing.shop].name}:
              ${(listing.prevPrice / exchangeRates[listing.prevCurrency.toUpperCase()]).toFixed(2)} ${watch.currency.toUpperCase()} -> ${(listing.price / exchangeRates[listing.currency.toUpperCase()]).toFixed(2)} ${watch.currency.toUpperCase()}
              ${listing.url}
            `).join('\n\n')}
          ` : ''
        }

        You received this email because you have set a watch for this item. You can manage your watches anytime at the following URL: ${profileUrl}
      `,
      html: `
        Hello,<br />
        <br />
        ${
          newListings.length > 0 ? `
            ${newListings.length > 1 ? 'Listings' : 'A listing'} for <a href="${siteUrl}/figure/${figure.slug || figure._id.toString()}">${figureName}</a> ${newListings.length > 1 ? 'have' : 'has'} been found: <br />
            <br />
            ${newListings.map(listing => `
              <a href="${listing.url}">
                <strong>${listing.title || figureName}</strong><br />
                ${(listing.price / exchangeRates[listing.currency.toUpperCase()]).toFixed(2)} ${watch.currency.toUpperCase()} on ${shops[listing.shop].name}
              </a>
            `).join('<br /><br />')}
            <br /><br />
          ` : ''
        }
        ${
          newPrices.length > 0 ? `
            ${newPrices.length > 1 ? 'Prices' : 'A price'} for <a href="${siteUrl}/figure/${figure.slug || figure._id.toString()}">${figureName}</a> ${newPrices.length > 1 ? 'have' : 'has'} changed: <br />
            <br />
            ${newPrices.map(listing => `
              <a href="${listing.url}">
                <strong>${listing.title || figureName}</strong> in ${shops[listing.shop].name}:<br />
                ${(listing.prevPrice / exchangeRates[listing.prevCurrency.toUpperCase()]).toFixed(2)} ${watch.currency.toUpperCase()} -> 
                <strong>${(listing.price / exchangeRates[listing.currency.toUpperCase()]).toFixed(2)} ${watch.currency.toUpperCase()}</strong>
              </a>
            `).join('<br /><br />')}
            <br /><br />
          ` : ''
        }
        You received this email because you have set a watch for this item. You can manage your watches anytime at the following URL: ${profileUrl}
      `
    }

    await sendMail(email, watch.user)
  } catch (error) {
    console.error(`Error when checking for new listings for watch ID#${watch._id.toString()}`, error)
  }
}

export default async function checkListingsForWatches (_id: string) {
  const currentlySearchingKey = `currently_searching_for_listings_${_id}`
  const currentlySearchingCount = parseInt(await redis.get(currentlySearchingKey) || '0')

  if (currentlySearchingCount > 0) return

  try {
    const redisKey = `listingsToCheckByShop_${_id}`
    const stringListingsByShop: { [key: string]: string[] } = JSON.parse(await redis.get(redisKey) || '{}')

    if (!stringListingsByShop || !Object.keys(stringListingsByShop).length) return

    const listingsByShop: { [key: string]: Listing[] } = {}

    for (let i = 0; i < Object.keys(stringListingsByShop).length; i++) {
      const shop = Object.keys(stringListingsByShop)[i]

      listingsByShop[shop] = stringListingsByShop[shop].map(stringListings => JSON.parse(stringListings))
    }

    const figure = await Figures.findById({ _id })
    const watches = await Watches.find({ figure: figure._id }).populate(['user', 'newListings'])

    updateFigureCacheWithPriceData(figure, true)

    for (let i = 0; i < watches.length; i++) {
      const watch = watches[i]

      checkForNewListings(watch, listingsByShop, figure)
    }

    await redis.del(redisKey)
  } catch (error) {
    console.error('Error when checking listings for watches', error)
  }
}
