import axios from "axios"
import { Figure } from "../../types/Figure"
import { Listing } from "../../types/Listing"
import { Report } from "../../types/Report"
import Listings from "../models/Listing"
import Reports from "../models/Report"
import { shops } from "../../data/shops"
import { WatchOptions } from "../../types/Watch"

async function getResults (figure: Figure, shop: string, isWatch: boolean, urls?: string[], options?: WatchOptions, timeout = 1000 * 60 * 2, retryUntil = 1000 * 60 * 2 + Date.now(), testMode?: boolean): Promise<any[]> {
  let results = null

  try {
    const { data } = await axios({
      method: 'post',
      url: 'http://localhost:8000/getListings',
      timeout,
      data: {
        shop,
        figure,
        urls,
        options,
        priority: isWatch ? 2 : 1,
        testMode
      }
    })

    results = data
  } catch (error: any) {
    if (Date.now() < retryUntil) {
      console.error(`Can't get results for ${figure._id.toString()} in ${shop} but retrying:`, error.message)

      await new Promise(resolve => setTimeout(resolve, 2000))

      return await getResults(figure, shop, isWatch, urls, options, timeout, retryUntil, testMode)
    }

    console.error(`Can't get results for ${figure._id.toString()} in ${shop}:`, error.message)

    throw new Error('Can\'t get results')
  }

  return results
}

export default async function getUnparsedListings (figure: Figure, shop: string, isWatch: boolean, options?: WatchOptions, timeout?: number, testMode?: boolean) {
  const shopInfo = shops[shop]

  let listings: Listing[] = []

  if (shopInfo.checkExistingListingsUrls) {
    const wrongListings: Report[] = await Reports.find({
      figure: figure._id,
      $and: [
        { listing: { $exists: true } },
        { listing: { $ne: null } }
      ],
      isConfirmed: true
    }).populate('listing')

    listings = await Listings.find({
      url: { $nin: wrongListings.map(report => report.listing.url) },
      shop,
      figure: figure._id,
      $or: [
        {
          isWrong: { $exists: false }
        },
        {
          isWrong: false
        }
      ]
    })
  }

  const urls = shopInfo.checkExistingListingsUrls && listings.length ? [...new Set(listings.map(listing => listing.url))] : undefined
  const results = await getResults(figure, shopInfo.mirrorShop || shop, isWatch, urls, options, timeout, undefined, testMode)

  return results
}