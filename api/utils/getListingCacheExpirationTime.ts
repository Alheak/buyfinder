import { shops } from "../../data/shops"
import { Shop } from "../../types/Shops"

export default function getListingCacheExpirationTime (shop: string, defaultExpirationTime: number = 60 * 60 * 8) {
  const shopInfo: Shop = shops[shop]

  let expirationTime = defaultExpirationTime

  if (shopInfo.stockResetTime) {
    const now = new Date()
    const stockDate = new Date()
    const [stockTimeHours, stockTimeMinutes] = shopInfo.stockResetTime.split(':').map(number => parseInt(number))

    stockDate.setUTCHours(stockTimeHours)
    stockDate.setUTCMinutes(stockTimeMinutes)
    stockDate.setUTCSeconds(0)

    if (stockDate.getTime() < now.getTime()) stockDate.setTime(stockDate.getTime() + 1000 * 60 * 60 * 24)

    expirationTime = (stockDate.getTime() - now.getTime()) / 1000

    // console.log('Next restock for', shop, 'on', stockDate, ', in', expirationTime, 'seconds')
  }

  return expirationTime
}
