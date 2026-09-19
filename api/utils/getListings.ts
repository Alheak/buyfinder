import Reports from "../models/Report"
import Listings from "../models/Listing"
import { shops } from "../../data/shops"
import getMirrorShopCachedListings from "./getMirrorShopCachedListings"
import checkListingForAvailability from "./checkListingForAvailability"
import getUnparsedListings from "./getUnparsedListings"
import parseListingsResults from "./parseListingsResults"
import { Figure } from "../../types/Figure"
import { WatchOptions } from "../../types/Watch"

export default async function getListingsHelper (figure: Figure, shop: string, isWatch: boolean = false, options?: WatchOptions, timeout?: number, testMode?: boolean) {
  const shopInfo = shops[shop]

  let listings = await getMirrorShopCachedListings(figure, shop)
  let listingsToCheck = []

  if (shopInfo.checkExistingListings) {
    const wrongListings = await Reports.find({
      figure: figure._id,
      $and: [
        { listing: { $exists: true } },
        { listing: { $ne: null } }
      ],
      isConfirmed: true
    }).populate('listing')

    listingsToCheck = await Listings.find({
      url: { $nin: wrongListings.map(report => report.listing.url) },
      figure: figure._id,
      shop,
      $or: [
        { isWrong: { $exists: false } },
        { isWrong: false }
      ]
    })

    for (let i = 0; i < listingsToCheck.length; i++) {
      const listing = listingsToCheck[i]
      const checkedListing = await checkListingForAvailability(listing, shop)
      
      if (checkedListing) listings.push(checkedListing)
    }
  }

  if ((!listings || !listings.length) && (!listingsToCheck || !listingsToCheck.length)) {
    // console.log(`Fetching listings for figure ${figure._id} in ${shop}`)

    const results = await getUnparsedListings(figure, shop, isWatch, options, timeout, testMode)
  
    // console.log(`Received ${results?.length || 'no'} potential results for figure ${figure._id} in ${shop}:`, results)

    if (results === null) return null

    listings = await parseListingsResults(figure, shop, results)

    if (shopInfo.checkResults) {
      const checkedListings = []

      for (let i = 0; i < listings.length; i++) {
        const listing = listings[i]
        const checkedListing = await checkListingForAvailability(listing, shop)

        if (checkedListing) checkedListings.push(checkedListing)
      }

      return checkedListings
    }

    // console.log(`Listings for ${figure._id} in ${shop} have been parsed:`, listings)
  }
  
  // console.log(`Received ${listings.length || 'no'} confirmed listings for figure ${figure._id} in ${shop}`)

  return listings
}
