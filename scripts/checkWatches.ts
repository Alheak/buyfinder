import mongoose, { HydratedDocument } from 'mongoose'
import redis from '../api/utils/redisClient'
import Watches from "../api/models/Watch"
import { shops } from "../data/shops"
import { checkForNewListings } from "../api/utils/checkListingsForWatches"
import connectDB from "../api/utils/connectDB"
import shopCanBeSearched from "../api/utils/shopCanBeSearched"
import getListingsHelper from '../api/utils/getListings'
import Users from '../api/models/User'
import { Watch, frequencies } from '../types/Watch'
import { Listing } from '../types/Listing'
import { getServerLoad } from '../api/controllers/queues'

(async () => {
  connectDB()

  const MIN_TOTAL_CHECK_TIME = 1000 * 60 * 10
  const TOTAL_SHOP_COUNT = Object.keys(shops).length

  async function checkForListings (watch: HydratedDocument<Watch>, shop: string, timeout = 1000 * 60 * 2, delay = 0) {
    await new Promise(resolve => setTimeout(resolve, delay))

    const figure = watch.figure

    // console.log('Currently checking listings for watch', watch._id.toString(), 'in', shop)

    let shopListings: Listing[] | null = null

    try {
      const user = await Users.findById(watch.user._id)

      if (user.watchPoints <= 0) {
        // console.log('User', user._id.toString(), 'doesn\'t have any remaining watch points. Aborting the search.')
        
        watch.activeSearch = false

        await watch.save()

        return null
      }

      const redisKey = `cached_results_${figure._id.toString()}_${shop}`
      const resultsAreCached = await redis.exists(redisKey)

      if (resultsAreCached) {
        shopListings = JSON.parse(await redis.get(redisKey) || '[]')
      } else {
        try {
          if (!(await shopCanBeSearched(figure, shop))) return null
    
          const watchOptions = watch.shopRules ? watch.shopRules[shop] : undefined
  
          while (await getServerLoad()) {
            // console.log('Waiting for server load to decrease...')
      
            await new Promise(resolve => setTimeout(resolve, 1000 * 10))
          }
    
          shopListings = await getListingsHelper(figure, shop, true, watchOptions, timeout)

          if (shops[shop].watchCheckCacheTime && !resultsAreCached) {
            await redis.set(redisKey, JSON.stringify(shopListings), 'EX', shops[shop].watchCheckCacheTime as number)
          }
        } catch (error) {
          console.error(`Couldn't get listings for ${figure.name} in ${shop}`, error)
          
          throw new Error(`Couldn't get listings for ${figure.name} in ${shop}`)
        }
      }
  
      if (shopListings === null) return []
  
      try {
        user.watchPoints--
  
        await user.save()
      } catch (error) {
        console.error('Couldn\'t substract watch point from user', watch.user._id.toString(), ':', error)
      }
    } catch (error) {
      console.error('Something went wrong trying to search for watch', watch._id.toString(), ':', error)
    }

    return shopListings
  }

  async function checkWatches (watch: any, delay: number = 0, estimatedTime: number = 1000 * 60) {
    // console.log('Waiting', delay, 'ms before starting watch', watch._id.toString())

    await new Promise(resolve => setTimeout(resolve, delay))

    try {
      const figure = watch.figure
      const shopsToCheck = watch.shopsToSearch.filter((shop: string) => Object.keys(shops).includes(shop)) as string[]
  
      // console.log('Currently checking watch', watch._id.toString(), 'with', shopsToCheck.length, 'shops to check')
  
      const delayBetweenShopSearch = Math.round(estimatedTime / shopsToCheck.length)
  
      // console.log('Estimated time for watch', watch._id.toString(), ':', estimatedTime, 'ms')
      // console.log('Delay between shop searches for watch', watch._id.toString(), ':', delayBetweenShopSearch)

      let results: (Listing[] | null)[] = []

      results = await Promise.all(shopsToCheck.map((shop, i) => checkForListings(
          watch,
          shop,
          1000 * 60 * 2,
          i * delayBetweenShopSearch
        )
      ))

      const listingsByShop: { [key: string]: Listing[] } = {}

      for (let i = 0; i < shopsToCheck.length; i++) {
        const shop = shopsToCheck[i]
        const result = results[i]

        if (result !== null) listingsByShop[shop] = result
      }
  
      await checkForNewListings(watch, listingsByShop, figure)

      watch.lastCheck = new Date()

      await watch.save()
    } catch (error) {
      console.error('Failed to check for listings for watch', watch._id.toString(), error)
    }

    return
  }

  const $or = [
    {
      lastCheck: { $exists: false }
    },
    {
      lastCheck: null
    },
    {
      frequency: { $exists: false }
    },
    ...frequencies.map(frequency => ({
      frequency,
      lastCheck: {
        $lte: new Date(Date.now() - (frequency - MIN_TOTAL_CHECK_TIME))
      }
    }))
  ]
  const watchesToCheck = await Watches.find({
    activeSearch: true,
    $or
  }).populate(['user', 'newListings', 'figure']).sort({ figure: 1, createdAt: 1 })
  const viableWatches = watchesToCheck.filter(watch => watch.user.watchPoints && watch.user.watchPoints > 0)
  const totalSearches = (viableWatches as Watch[]).reduce((prev: number, watch: Watch) => {
    const shopsToSearch = watch.shopsToSearch?.filter(shop => Object.keys(shops).includes(shop))
    const shopsToIgnore = watch.shopsToIgnore?.filter(shop => Object.keys(shops).includes(shop))
  
    return prev + (shopsToSearch ? shopsToSearch.length : (TOTAL_SHOP_COUNT - (shopsToIgnore?.length || 0)))
  }, 0)
  const timePerSearch = Math.max(5000, Math.round((MIN_TOTAL_CHECK_TIME) / totalSearches))

  // console.log('Starting new active watch search', viableWatches.map(watch => watch._id))
  // console.log('Checking', viableWatches.length, 'watches totalling', totalSearches, 'searches with', timePerSearch, 'ms between them.')

  let prevEstimatedTime = 0

  await Promise.all(viableWatches.map((watch, i) => {
    const timeToWait = prevEstimatedTime
    const shopsToSearch = watch.shopsToSearch?.filter((shop: string) => Object.keys(shops).includes(shop))
    const shopsToIgnore = watch.shopsToIgnore?.filter((shop: string) => Object.keys(shops).includes(shop))
    const estimatedTime = timePerSearch * (shopsToSearch ? shopsToSearch.length : (TOTAL_SHOP_COUNT - (shopsToIgnore?.length || 0)))

    prevEstimatedTime += estimatedTime

    return checkWatches(watch, timeToWait, estimatedTime)
  }))

  // console.log('All watches have been checked. Exiting...')

  mongoose.connections[mongoose.connections.length - 1].close()

  await redis.quit()
})()
