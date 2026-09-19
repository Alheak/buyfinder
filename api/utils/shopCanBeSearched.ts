import redis from '../utils/redisClient'
import NoHits from '../models/NoHit'
import { shops } from "../../data/shops"
import { Figure } from "../../types/Figure"
import { FilterQuery } from 'mongoose'
import figureReleaseDate from './figureReleaseDateForComparison'
import { CachedListings } from '../../types/Listing'
import getListingCacheExpirationTime from './getListingCacheExpirationTime'

const ONE_MONTH = 1000 * 60 * 60 * 24 * 30

export default async function shopCanBeSearched (figure: Figure, shop: string) {
  try {
    const shopInfo = shops[shop]
    const key = `listings_${figure._id.toString()}_${shop}`
    const listings: CachedListings = { listings: [], nextSearch: null }

    if (figure.name.includes('NSFW') && shopInfo.nsfwBlock) {
      // console.log('The shop', shop, 'hides NSFW listings, skipping', figure._id.toString())

      await redis.set(key, JSON.stringify(listings))

      return false
    }

    if ((figure.category === 'Garage Kits' || figure.classification === 'Doujin Figure') && !shopInfo.hasGarageKits && figure.classification !== 'CharaGumin') {
      // console.log('The shop', shop, 'doesn\'t contain GKs or doujin figures, skipping', figure._id.toString())

      await redis.set(key, JSON.stringify(listings))

      return false
    } else {
      await redis.del(key)
    }

    if (shopInfo.onlyTerms) {
      const containsTerm = shopInfo.onlyTerms.filter(([term, regex]) => regex.test(figure[term] || '')).length > 0

      if (!containsTerm) {
        // console.log('The shop', shop, 'doesn\'t contain this kind of item, skipping figure', figure._id.toString())

        await redis.set(key, JSON.stringify(listings))

        return false        
      }
    }

    if (shopInfo.skipTerms) {
      const containsTerm = shopInfo.skipTerms.filter(([term, regex]) => regex.test(figure[term] || '')).length > 0

      if (containsTerm) {
        // console.log('The shop', shop, 'doesn\'t contain this kind of item, skipping figure', figure._id.toString())

        await redis.set(key, JSON.stringify(listings))

        return false        
      }
    }

    const expirationTime = getListingCacheExpirationTime(shop)
    const lastSearch = Date.now()
    const nextSearch = lastSearch + 1000 * expirationTime

    if (shopInfo.noHitShop) {
      const query: FilterQuery<any> = { figure: figure._id, shop }
      const latestRelease = figure.releases.reverse().find(release => !!release.date)

      if (latestRelease && latestRelease.date) {
        const releaseDate = new Date(figureReleaseDate(latestRelease.date).getTime() + ONE_MONTH * 2) // Add 2 months to take into account differences in release dates for certain shops

        query.createdAt = { $gte: releaseDate }
      }

      const isNotAScalePrepaintedFigure = !(figure.category === 'Prepainted' && !!figure.scale)

      if (isNotAScalePrepaintedFigure) {
        const oneMonthAgoTime = Date.now() - ONE_MONTH
        const oneMonthAgoDate = new Date(oneMonthAgoTime)

        query.createdAt = {
          $gte: !!query.createdAt?.$gte && query.createdAt.$gte.getTime() > oneMonthAgoTime ? query.createdAt.$gte : oneMonthAgoDate
        }
      }

      const noHit = await NoHits.findOne(query)

      if (noHit) {
        // console.log('Last search did not find the item even though it is already released and the shop', shop, 'doesn\'t restock, skipping figure', figure._id.toString())

        listings.lastSearch = lastSearch
        listings.nextSearch = nextSearch

        await redis.set(key, JSON.stringify(listings))

        return false
      }
    }

    if (shopInfo.hasPreorders === false && figure.releases && figure.releases.length) {
      const earliestReleaseDate = figure.releases.filter(release => !!release.date).map(release => release.date).sort()[0]

      if (earliestReleaseDate) {
        const releaseTime = figureReleaseDate(earliestReleaseDate).getTime()
        const now = Date.now()

        if (releaseTime > now) {
          // console.log(`Figure ${figure._id.toString()} hasn't been released yet and ${shop} doesn't do pre-orders, skipping.`)

          listings.lastSearch = lastSearch
          listings.nextSearch = nextSearch

          await redis.set(key, JSON.stringify(listings))

          return false
        }
      }
    }

    return true
  } catch (error) {
    console.error('Couldn\'t check if shop could be searched', shop, error)

    return true
  }
}
