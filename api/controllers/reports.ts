import { Types } from "mongoose"
import redis from "../utils/redisClient"
import { Report, ReportData } from "../../types/Report"
import Reports from "../models/Report"
import Figures from "../models/Figure"
import connectDB from "../utils/connectDB"
import Listings from "../models/Listing"
import { User } from "../../types/User"
import Users from "../models/User"
import ShopSearches from '../models/ShopSearch'
import { createNotification } from "./notifications"
import { getSearches } from "../../crawler/utils"
import { shops } from "../../data/shops"
import { SearchLanguages } from "../../types/Shops"
import { creditWatchPoints } from "../utils/creditWatchPoints"
import Prices from "../models/Price"
import PricePoint from "../models/PricePoint"
import { Figure } from "../../types/Figure"
import getWatchPointsAmount from "../utils/getWatchPointsAmount"
import { Listing } from "../../types/Listing"

connectDB()

const DEDUCT_AMOUNT = 100

export async function createReport (reportData: ReportData, user?: User, ip?: any) {
  try {
    if (!reportData.shop || !Object.keys(shops).includes(reportData.shop)) {
      console.error('Shop', reportData.shop, 'does not exist')

      throw new Error('Shop does not exist')
    }

    const listing = reportData.listingId ? new Types.ObjectId(reportData.listingId) : null
    const figure = reportData.figureId ? new Types.ObjectId(reportData.figureId) : null

    if (reportData.type === 'falsePositive') {
      if (!listing || !figure) throw new Error('Cannot create a report for a false positive without a listing or a figure')
    } else if (reportData.type === 'falseNegative') {
      if (!figure || !reportData.shop) throw new Error('Cannot create a report for a false negative without a figure or a shop')
    }

    const exists = await Reports.findOne({
      listing,
      figure,
      user: user?._id,
      shop: reportData.shop,
      type: reportData.type,
      isConfirmed: {
        $exists: false
      },
      fromIp: user ? null : `${ip}`
    })

    if (!!exists) return null

    const figureInstance: Figure | null = await Figures.findById(figure)

    if (!figureInstance) {
      console.error('Figure', figure?.toString(), 'does not exist')

      throw new Error('Figure can\'t be found for report')
    }

    if (reportData.type === 'falsePositive') {
      const listingInstance: Listing | null = await Listings.findById(listing)

      if (!listingInstance) {
        console.error('Listing', listing?.toString(), 'does not exist')

        throw new Error('Listing can\'t be found for report')
      }
    }

    if (reportData.listingId) delete reportData.listingId
    if (reportData.figureId) delete reportData.figureId

    const report = await Reports.create({
      ...reportData,
      listing,
      figure,
      user: user ? user._id : null
    })

    return report
  } catch (error) {
    console.error('Error when creating a new report', reportData, error)

    throw new Error('Error when creating a new report')
  }
}

export async function getReports (type: 'falsePositive' | 'falseNegative' = 'falsePositive') {
  const reports: Report[] = await Reports.find({ type, isConfirmed: { $exists: false }, figure: { $exists: true } })
    .sort({ createdAt: 1 })
    .limit(20)
    .populate([
      {
        path: 'listing',
        populate: {
          path: 'figure',
          model: 'figures'
        }
      },
      'figure',
      'user'
    ])
    .lean() as any

  for (let i = 0; i < reports.length; i++) {
    const report = reports[i]

    if (!report.shop || !shops[report.shop]) continue

    const figure = report.figure || report.listing.figure
    const shopSearches = await ShopSearches.find({
      shop: report.shop,
      figure: figure._id
    })
    const shop = shops[report.shop]
    const termsData = shop.termsLang && figure[shop.termsLang as SearchLanguages] ? figure[shop.termsLang as SearchLanguages] : figure

    reports[i].shopSearches = shopSearches.length
      ? shopSearches.map(shopSearch => shopSearch.search)
      : await getSearches(termsData, shop.searchTerms.filter(searchTerm => searchTerm !== 'jan'), figure, shop, true)

  }

  return reports
}

export async function confirmReport (_id: Types.ObjectId, isConfirmed: boolean, attributePoints?: boolean, deductPoints?: boolean, reason?: string) {
  try {
    const report = await Reports.findById(_id)

    if (!report) throw new Error('Report doesn\'t exist')
    
    let figure = null
    let shop = report.shop

    if (!!report.listing) {
      const listing = await Listings.findById(report.listing).populate('figure')

      if (!!listing) {
        figure = listing.figure
        shop = listing.shop
      }
    }
    
    if (!figure && !!report.figure) {
      figure = await Figures.findById(report.figure)
    }

    if (!figure) throw new Error(`No figure found for report ${report._id.toString()}`)

    report.isConfirmed = isConfirmed

    await report.save()

    if (report.isConfirmed || attributePoints) {
      await redis.del(`listings_${figure._id.toString()}_${shop}`)

      if (!!report.listing) {
        const prices = await Prices.find({
          listing: report.listing
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
          figure: figure._id.toString(),
          yearMonth: { $in: [...yearMonthsSet] }
        })
      }
    }

    if (!report.user) return report

    const user = await Users.findById(report.user)

    if (!user) throw new Error('No user found', report.user)

    if (deductPoints) {
      try {
        await creditWatchPoints(user, -DEDUCT_AMOUNT, 'abuse')

        await createNotification(user, `Your report of a ${report.type === 'falsePositive' ? 'wrong' : 'missing'} listing of ${figure.name} in ${shops[shop].name} has been rejected and ${DEDUCT_AMOUNT} Watch Points have been deducted for abuse${reason ? ` with the following explanation: ${reason}` : ''}.`, `/figure/${figure.slug || figure._id.toString()}`)
      } catch (error) {
        console.error('Error when trying to reject report with points deduction', error)
      }
    } else if (attributePoints) {
      try {
        const watchPointsAmount = await getWatchPointsAmount(figure, shop)
    
        await creditWatchPoints(user, watchPointsAmount, 'report')

        await createNotification(user, `Your report of a ${report.type === 'falsePositive' ? 'wrong' : 'missing'} listing of ${figure.name} in ${shops[shop].name} has been confirmed, you earned ${watchPointsAmount} Watch Points.`, `/figure/${figure.slug || figure._id.toString()}`)
      } catch (error) {
        console.error('Error when trying to attribute watch points', error)
      }
    } else if (!attributePoints) {
      try {
        await createNotification(user, `Your report of a ${report.type === 'falsePositive' ? 'wrong' : 'missing'} listing of ${figure.name} in ${shops[shop].name} has been rejected${reason ? ` for the following reason: ${reason}` : ''}.`, `/figure/${figure.slug || figure._id.toString()}`)
      } catch (error) {
        console.error('Error when trying to reject report', error)
      }
    }

    return report
  } catch (error) {
    console.error('Error when confirming the report', _id, error)

    throw new Error('Error when confirming the report')
  }
}

export async function addSearch (shop: string, figureId: Types.ObjectId, searchSuggestion: string) {
  try {
    const figure = await Figures.findById(figureId)
    const search = await ShopSearches.findOne({
      shop,
      figure,
      search: searchSuggestion
    })

    if (!search) await ShopSearches.create({
      shop,
      figure,
      search: searchSuggestion
    })

    const searches = await ShopSearches.find({
      shop,
      figure
    })

    return searches.map(search => search.search)
  } catch (error) {
    console.error('Error when adding the search for figure', figureId ,'in', shop, ': ', error)

    throw new Error('Error when adding the search')
  }
}
