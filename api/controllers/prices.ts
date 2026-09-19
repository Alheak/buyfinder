import { FilterQuery } from "mongoose"
import Figures from "../models/Figure"
import Listings from "../models/Listing"
import Prices from "../models/Price"
import Reports from "../models/Report"
import { DataPoint, PricePoint } from "../../types/Price"
import { Figure } from "../../types/Figure"
import getExchangeRates from "../utils/getExchangeRates"
import { Report } from "../../types/Report"
import { Types } from "mongoose"
import PricePoints from "../models/PricePoint"
import formatDate from "../../mixins/formatDate"

interface ConvertedPrice {
  listing: Types.ObjectId
  price: number
  currency: string
  convertedPrice: number
}

export async function calculatePricePoint (figure: Figure, yearMonth: string, shop?: string, condition?: 'used' | 'new', percentile?: number) {
  try {
    const wrongListings: Report[] = await Reports.find({
      figure: figure._id,
      $and: [
        { listing: { $exists: true } },
        { listing: { $ne: null } }
      ],
      isConfirmed: true
    }).populate('listing')
    const listingsQuery: FilterQuery<any> = {
      url: { $nin: wrongListings.map(report => report.listing.url) },
      figure: figure._id,
      $or: [{ isWrong: false }, { isWrong: { $exists: false } }]
    }
  
    if (shop) listingsQuery.shop = shop
    if (condition) listingsQuery.condition = condition
  
    const listings = await Listings.find(listingsQuery)
  
    const [fromYear, fromMonth] = yearMonth.split('/').map(curr => parseInt(curr))
    const fromDate = new Date(fromYear + '-' + (fromMonth < 10 ? '0' : '') + fromMonth + '-01T00:00:00.000Z')
  
    let toYear = fromYear
    let toMonth = fromMonth + 1
  
    if (toMonth > 12) {
      toMonth = 1
      toYear++
    }
  
    const toDate = new Date(toYear + '-' + (toMonth < 10 ? '0' : '') + toMonth + '-01T00:00:00.000Z')
  
    const exchangeRates: { [key: string]: number } = await getExchangeRates('JPY')
    const $match: FilterQuery<any> = {
      listing: {
        $in: listings.map(listing => listing._id)
      },
      updatedAt: {
        $lt: toDate
      }
    }
  
    $match.updatedAt.$gte = fromDate
  
    const prices = await Prices.aggregate([
      {
        $match
      },
      {
        $group: {
          _id: {
            listing: '$listing',
            price: '$price',
            currency: '$currency'
          }
        }
      }
    ])
  
    let price: number | undefined = undefined

    if (prices && prices.length) {
      const convertedPrices: ConvertedPrice[] = []
    
      for (let i = 0; i < prices.length; i++) {
        const price = prices[i]._id
        const convertedPrice = {
          ...price,
          convertedPrice: price.price / exchangeRates[price.currency.toUpperCase()]
        }
    
        convertedPrices.push(convertedPrice)
      }
    
      if (percentile !== undefined && !Number.isNaN(percentile)) {
        const sortedPrices = convertedPrices.sort(({ convertedPrice: priceA }, { convertedPrice: priceB }) => priceA - priceB)
    
        const index = (sortedPrices.length - 1) * percentile / 100
        const percentilePrices = index % 1 !== 0 ? [sortedPrices[Math.floor(index)], sortedPrices[Math.ceil(index)]] : [sortedPrices[index]]
        const percentilePrice = percentilePrices.reduce((prev, curr) => prev + (curr.price / exchangeRates[curr.currency.toUpperCase()]), 0) / percentilePrices.length
    
        price = parseInt(percentilePrice.toFixed(0))
      } else {
        price = parseInt((convertedPrices.reduce((prev, curr) => prev + curr.convertedPrice, 0) / convertedPrices.length).toFixed(0))
      }
    }
  
    const pricePoint = await PricePoints.create({
      figure: figure._id,
      price,
      yearMonth: `${fromYear}/${fromMonth}`,
      condition,
      percentile,
      shop
    })
  
    return pricePoint
  } catch (error) {
    console.error('Error when trying to calculate', percentile ? (percentile + 'th percentile') : 'average', 'price point for figure', figure._id.toString(), 'of month', yearMonth, 'in', shop || 'all shops', 'of', condition || 'all', 'condition:', error)

    return null
  }
}

async function getPricePoint (figure: Figure, yearMonth: string, shop?: string, condition?: 'used' | 'new', percentile?: number) {
  try {
    const query = {
      figure: figure._id,
      yearMonth,
      condition: condition || 'all',
      percentile,
      shop
    }
    const pricePoint = (await PricePoints.findOne(query)) || await calculatePricePoint(figure, yearMonth, shop, condition, percentile)

    return pricePoint
  } catch (error) {
    console.error('Error when trying to get', percentile ? (percentile + 'th percentile') : 'average', 'price point for figure', figure._id.toString(), 'of month', yearMonth, 'in', shop || 'all shops', 'of', condition || 'all', 'condition:', error)

    return null
  }
}

export async function getPricesDataset (figureId: string, from?: Date, to: Date = new Date(), shop?: string, condition?: 'new' | 'used', percentile?: number) {
  if (percentile !== undefined && !Number.isNaN(percentile)) {
    if (percentile < 0) percentile = 0
    if (percentile > 100) percentile = 100
  }

  try {
    const figure: Figure | null = await Figures.findById(figureId)

    if (!figure) return []

    let toMonth = to.getUTCMonth() + 2
    let toYear = to.getUTCFullYear()

    if (toMonth > 12) {
      toMonth = 1
      toYear++
    }

    if (!from) {
      from = new Date()
      from.setUTCFullYear(from.getUTCFullYear() - 1)
    }

    let fromMonth = from.getUTCMonth()
    let fromYear = from.getUTCFullYear()

    if (fromMonth === 0) {
      fromMonth = 12
      fromYear--
    }

    const nowDate = new Date()
    const now = nowDate.getTime()

    if (Math.abs(now - to.getTime()) < 1000 * 60 * 60 * 24) to = new Date()

    const years = toYear - fromYear
    const months = toMonth - fromMonth
    const monthsTotal = years * 12 + months

    let currMonth = fromMonth
    let currYear = fromYear

    const timePeriods = Array.from(new Array(monthsTotal), function() {
      const yearMonth = `${currYear}/${currMonth}`

      currMonth++

      if (currMonth > 12) {
        currMonth = 1
        currYear++
      }

      return yearMonth
    })

    const pricePoints: PricePoint[] = await Promise.all(timePeriods.map(yearMonth => getPricePoint(figure, yearMonth, shop, condition, percentile)))
    const dataset: DataPoint[] = []

    for (let i = 0; i < pricePoints.length; i++) {
      const pricePoint = pricePoints[i]
      
      if (!pricePoint || !pricePoint.price) continue

      const [year, month] = pricePoint.yearMonth.split('/').map(curr => parseInt(curr))

      let untilMonth = month + 1
      let untilYear = year

      if (untilMonth > 12) {
        untilYear++
        untilMonth = 1
      }

      const untilDate = new Date(untilYear + '-' + (untilMonth < 10 ? '0' : '') + untilMonth + '-01T00:00:00.000Z')

      dataset.push({
        x: formatDate(untilDate),
        y: pricePoint.price
      })
    }

    return dataset
  } catch (error) {
    console.error('Error when calculating prices datasets for figure', figureId, error)

    return []
  }
}
