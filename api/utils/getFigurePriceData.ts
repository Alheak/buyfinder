import { Figure } from "../../types/Figure"
import { Price } from "../../types/Price"
import Figures from "../models/Figure"
import Listings from "../models/Listing"
import Prices from "../models/Price"
import Reports from "../models/Report"
import Searches from "../models/Search"
import getExchangeRates from "./getExchangeRates"
import elasticClient from './elasticClient'
import getDocForIndexing from "./getDocForIndexing"

const ONE_MONTH = 1000 * 60 * 60 * 24 * 30

async function getPriceData (figure: Figure) {
  const priceData = {
    searchCount: 0,
    startingPrice: 0,
    averagePrice: 0,
    priceChange: 0,
    minPrice: 0,
    maxPrice: 0
  }

  try {
    const searchCount = await Searches.countDocuments({ figure: figure._id })

    if (searchCount) priceData.searchCount = searchCount
  } catch (error) {
    console.error('Couldn\'t get search count for figure', figure._id.toString())
  }

  try {
    const reports = await Reports.find({
      figure: figure._id,
      $and: [
        { listing: { $exists: true } },
        { listing: { $ne: null } }
      ],
      isConfirmed: true
    }).populate('listing')
    const listings = await Listings.find({
      url: { $nin: reports.map(report => report.listing.url) },
      figure: figure._id,
      $or: [
        {
          isWrong: false
        },
        {
          isWrong: {
            $exists: false
          }
        }
      ]
    })
    const prices: Price[] = await Prices.find({
      listing: {
        $in: listings.map(listing => listing._id)
      }
    }).sort({
      createdAt: 1
    })

    // console.log('Found', prices.length, 'prices')

    const exchangeRates: { [key: string]: number } = await getExchangeRates('JPY')
    const earliestRelease = figure.releases?.reverse().find(release => !!release.date && !!release.price)

    if (earliestRelease) {
      if (!prices || !prices.length) {
        priceData.startingPrice = earliestRelease.price ? earliestRelease.price / exchangeRates[earliestRelease.currency?.toUpperCase() || 'JPY'] : 0
        priceData.averagePrice = priceData.startingPrice
    
        return priceData
      }
    
      if (earliestRelease.date && earliestRelease.price) priceData.startingPrice = earliestRelease.price / exchangeRates[earliestRelease.currency?.toUpperCase() || 'JPY']
    }

    if (!prices || !prices.length) {
      priceData.minPrice = priceData.startingPrice
      priceData.maxPrice = priceData.startingPrice

      return priceData
    }

    if (priceData.startingPrice === 0) {
      const earliestPrice = prices[0]
      const earliestPrices = prices.filter(price => new Date(price.createdAt).getTime() <= (new Date(earliestPrice.createdAt).getTime() + ONE_MONTH))

      if (earliestPrices.length) priceData.startingPrice = earliestPrices.reduce((sum, price) => sum + (price.price / exchangeRates[price.currency.toUpperCase()]), 0) / earliestPrices.length
    }

    const latestPrice = prices[prices.length - 1]
    const latestPrices = prices.filter(price => new Date(price.createdAt).getTime() >= (new Date(latestPrice.createdAt).getTime() - ONE_MONTH))

    if (latestPrices.length) {
      const uniquePricesSet = new Set()
      const uniquePrices = latestPrices.filter(price => {
        const priceKey = `${price.listing._id.toString()}_${price.price}`

        if (uniquePricesSet.has(priceKey)) return false

        uniquePricesSet.add(priceKey)

        return true
      })

      priceData.averagePrice = uniquePrices.reduce((sum, price) => sum + (price.price / exchangeRates[price.currency.toUpperCase()]), 0) / uniquePrices.length

      const sortedPrices = uniquePrices.sort((priceA, priceB) => {
        const convertedPriceA = priceA.price / exchangeRates[priceA.currency.toUpperCase()]
        const convertedPriceB = priceB.price / exchangeRates[priceB.currency.toUpperCase()]

        return convertedPriceA - convertedPriceB
      })
      const minPriceIndex = (sortedPrices.length - 1) * 10 / 100
      const maxPriceIndex = (sortedPrices.length - 1) * 90 / 100

      const minPrices = minPriceIndex % 1 !== 0 ? [sortedPrices[Math.floor(minPriceIndex)], sortedPrices[Math.ceil(minPriceIndex)]] : [sortedPrices[minPriceIndex]]
      const maxPrices = maxPriceIndex % 1 !== 0 ? [sortedPrices[Math.floor(maxPriceIndex)], sortedPrices[Math.ceil(maxPriceIndex)]] : [sortedPrices[maxPriceIndex]]

      priceData.minPrice = minPrices.reduce((prev, curr) => prev + (curr.price / exchangeRates[curr.currency.toUpperCase()]), 0) / minPrices.length
      priceData.maxPrice = maxPrices.reduce((prev, curr) => prev + (curr.price / exchangeRates[curr.currency.toUpperCase()]), 0) / maxPrices.length
    }

    if (priceData.averagePrice === 0) priceData.averagePrice = priceData.startingPrice
    if (priceData.minPrice === 0) priceData.minPrice = priceData.averagePrice
    if (priceData.maxPrice === 0) priceData.maxPrice = priceData.averagePrice

    if (priceData.startingPrice && priceData.averagePrice) priceData.priceChange = (priceData.averagePrice * 100 / priceData.startingPrice) - 100

    // console.log('Price data for', figure._id.toString(), priceData)

    return priceData
  } catch (error) {
    console.error('Error trying to get price data for figure', figure._id.toString(), error)

    return priceData
  }
}

export default async function getFigurePriceData (figure: Figure) {
  try {
    const priceData = await getPriceData(figure)
    const figureInstance = await Figures.findById(figure._id)
  
    figureInstance.priceData = priceData
  
    await figureInstance.save()

    try {
      const result = await elasticClient.search({
        index: 'figures',
        query: {
          match: {
            id: {
              query: figure._id.toString()
            }
          }
        }
      })
  
      if (result && result.hits.hits[0]._id) {
        const doc = await getDocForIndexing(figureInstance)
        const indexedDocId = result.hits.hits[0]._id
  
        // console.log('Updating indexed document', indexedDocId, doc)
  
        await elasticClient.update({
          index: 'figures',
          id: indexedDocId,
          body: {
            doc
          }
        })
      }
    } catch (error) {
      console.error('Couldn\'t update the indexed figure', figure, error)
    }

    return priceData
  } catch (error) {
    return  {
      searchCount: 0,
      startingPrice: 0,
      averagePrice: 0,
      priceChange: 0,
      minPrice: 0,
      maxPrice: 0
    }
  }
}
