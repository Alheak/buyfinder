import { shops } from "../../data/shops"
import { Figure } from "../../types/Figure"
import { Listing } from "../../types/Listing"
import checkListingForAvailability from "./checkListingForAvailability"
import redis from "./redisClient"

export default async function getMirrorShopCachedListings (figure: Figure, shop: string) {
  const shopInfo = shops[shop]

  if (!shopInfo.mirrorShop) return []

  const mirrorShopKey = `listings_${figure._id.toString()}_${shopInfo.mirrorShop}`

  if (!(await redis.exists(mirrorShopKey))) return []

  const cachedListings = (JSON.parse(await redis.get(mirrorShopKey) || '{ "listings": [] }'))
  const listings = ((cachedListings.listings === undefined ? cachedListings : cachedListings.listings) as Listing[]).map((listing: Listing) => {
    let url = listing.url
    
    if (!!shopInfo.itemIdRegex && !!shopInfo.replaceUrl) {
      const itemId = (shopInfo.itemIdRegex.exec(url) || [])[1]

      if (itemId) url = shopInfo.replaceUrl + itemId
    }

    return {
      ...listing,
      shop,
      url
    }
  })

  const checkedListings = []

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i]
    const checkedListing = await checkListingForAvailability(listing, shop)
    
    if (checkedListing) checkedListings.push(checkedListing)
  }

  return checkedListings
}
