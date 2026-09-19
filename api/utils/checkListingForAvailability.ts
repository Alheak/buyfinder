import { shops } from "../../data/shops"
import { Listing } from "../../types/Listing"
import axios from "axios"

export default async function checkListingForAvailability (listing: Listing, shop: string, retryUntil: number = 1000 * 60 * 2 + Date.now()): Promise<Listing | null> {
  const shopInfo = shops[shop]

  if (!shopInfo.checkSoldOutSelectors && !shopInfo.checkInStockSelectors) return listing

  try {
    const res = await axios({
      method: 'post',
      url: 'http://localhost:8000/checkListing',
      timeout: 1000 * 60 * 2,
      data: {
        shop,
        listing
      }
    })

    // console.log('Checking availability of listing', listing.url, 'in shop', shop, ':', res.data)

    return res.data
  } catch (error) {
    if (Date.now() < retryUntil) {
      console.error(`Can't check listing ${listing._id.toString()} in ${shop} but retrying:`, error)

      return await checkListingForAvailability(listing, shop, retryUntil)
    }

    console.error(`Can't check listing ${listing._id.toString()} in ${shop}:`, error)
  }

  return null
}
