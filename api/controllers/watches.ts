import redis from '../utils/redisClient'
import Stripe from "stripe"
import Users from "../models/User"
import { User } from "../../types/User"
import { Watch, WatchData, WatchFrequency, WatchOptions } from '../../types/Watch'
import Watches from "../models/Watch"
import connectDB from '../utils/connectDB'
import getExchangeRates from '../utils/getExchangeRates'
import { FilterQuery, Types } from "mongoose"
import { shops } from '../../data/shops'
import { Listing } from '../../types/Listing'
import updateFigureCacheWithPriceData from '../utils/updateFigureCacheWithPriceData'
import { creditWatchPoints } from '../utils/creditWatchPoints'
import { cancelSubscription } from './stripe'
import sendMail from '../utils/sendMail'
import Reports from '../models/Report'

connectDB()

interface WatchDataToPersist {
  figure: Types.ObjectId
  shopsToSearch?: string[]
  shopRules?: { [key: string]: WatchOptions }
  maximumPrice?: number | null
  currency?: string
  newListings?: Types.ObjectId[]
  activeSearch?: boolean
  frequency?: WatchFrequency
}

export async function getWatches (user: User, limit: number = 20, fromDate?: Date, activeSearch?: boolean) {
  const query: FilterQuery<any> = { user: user._id }

  if (activeSearch !== undefined) query.activeSearch = activeSearch
  if (!!fromDate) query.updatedAt = { $lt: fromDate }

  let watches: Watch[] = await Watches.find(query)
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate(['figure', 'newListings'])
    .lean() as any

  for (let i = 0; i < watches.length; i++) {
    const newListings = []
    const watch = watches[i]
    
    if (!watch.newListings) continue

    for (let j = 0; j < watch.newListings.length; j++) {
      const newListing = watch.newListings[j]

      if (newListing.isWrong || newListing.isActive === false) continue

      const reports = await Reports.find({
        figure: watch.figure._id,
        listing: newListing._id,
        isConfirmed: true
      })

      if (reports && reports.length) continue

      newListings.push(newListing)
    }

    watch.newListings = newListings
  }

  const watchesWithPriceData: Watch[] = []

  for (let i = 0; i < watches.length; i++) {
    let watch = watches[i]
    
    watch.figure = await updateFigureCacheWithPriceData(watch.figure)

    watchesWithPriceData.push(watch)
  }

  return watchesWithPriceData
}

export async function createWatch (user: User, watchData: WatchData) {
  try {
    const figure = new Types.ObjectId(watchData.figureId)
    const query = { user: user._id, figure }
    const watchDataToPersist: WatchDataToPersist = {
      shopsToSearch: watchData.shopsToSearch,
      shopRules: watchData.shopRules,
      maximumPrice: watchData.maximumPrice,
      currency: watchData.currency,
      figure,
      activeSearch: watchData.activeSearch,
      frequency: watchData.frequency
    }

    let watch = await Watches.findOne(query)

    if (watch) {
      Object.assign(watch, watchDataToPersist)

      await watch.save()
    } else {
      const exchangeRates: { [key: string]: number } = await getExchangeRates(watchData.currency?.toUpperCase() || 'JPY')
      const shopsToCheck = watchData.shopsToSearch || Object.keys(shops).filter(shop => !watchData.shopsToIgnore?.includes(shop))

      let newListings: Listing[] = []

      for (let i = 0; i < shopsToCheck.length; i++) {
        const shop = shopsToCheck[i]
        const redisKey = `listings_${figure.toString()}_${shop}`

        if (!(await redis.exists(redisKey))) continue

        const shopListings = JSON.parse(await redis.get(redisKey) || '{ "listings": [] }')
        const listings = (shopListings.listings === undefined ? shopListings : shopListings.listings) as Listing[]

        newListings = [...newListings, ...listings]
      }

      newListings = newListings.filter((listing) => {
        const price = listing.price / exchangeRates[listing.currency.toUpperCase()]
    
        return typeof watchData.maximumPrice === 'number' && price <= watchData.maximumPrice
      })

      watchDataToPersist.newListings = newListings.map((listing) => listing._id)

      watch = await Watches.create({
        user: user._id,
        ...watchDataToPersist
      })
    }

    watch = await Watches.findOne(query).populate(['figure', 'newListings'])

    await redis.set(`watches_${user._id.toString()}_${figure.toString()}`, JSON.stringify(watch))

    return watch
  } catch (error) {
    console.error('Error creating the watch', error)

    throw new Error('Error creating the watch')
  }
}

export async function deleteWatch (user: User, figureId: string) {
  try {
    const query = { user: user._id, figure: new Types.ObjectId(figureId) }

    let watch = await Watches.findOne(query)

    if (watch) {
      await Watches.deleteMany(query)

      watch = null
    }

    await redis.set(`watches_${user._id.toString()}_${figureId}`, JSON.stringify(watch))

    return watch
  } catch (error) {
    console.error('Error deleting the watch', error)

    throw new Error('Error deleting the watch')
  }
}

export async function updateWatchPointsSubscription (subscription: Stripe.Subscription) {
  const customer = subscription.customer
  const recurring = subscription.status === 'active'

  try {
    const userInstance = await Users.findOne({ stripeCustomerId: customer })
    const wasSubscribed = !!userInstance.watchPointsSubscription
    
    userInstance.watchPointsSubscription = recurring

    await userInstance.save()

    if (subscription.cancel_at_period_end) await cancelSubscription(subscription.id)

    if (!wasSubscribed && recurring) {
      try {
        await sendMail({
          subject: 'buyfinder - Watch Points Subscription',
          text: `
            Hello,
  
            We send you this email to notify you that you have successfully subscribed to a monthly Watch Points recharge.
            You can manage your subcription at the following url: ${process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_LINK}
  
            If you have any issue or question, do not hesitate to reply to this email.
  
            Thank you for your support!
          `,
          html: `
            Hello, <br />
            <br />
            We send you this email to notify you that you have successfully subscribed to a monthly Watch Points recharge.<br />
            You can manage your subcription at the following url: <a href="${process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_LINK}">${process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_LINK}</a><br />
            <br />
            If you have any issue or question, do not hesitate to reply to this email.<br />
            <br />
            Thank you for your support!
          `
        }, userInstance)
      } catch (error) {
        console.error('Couldn\'t send watch points subscription email', error)
      }
    }

    return userInstance
  } catch (error) {
    console.error('An error occured trying to update the watch points subscription status of customer', customer, 'with', recurring, error)

    throw new Error('An error occured trying to update the watch points subscription status')
  }
}

export async function updateWatchPoints (customer: string | Stripe.Customer | Stripe.DeletedCustomer, price: 599 | 999 | 1399) {
  try {
    // console.log('Received payment of', price, '.')

    const userInstance = await Users.findOne({ stripeCustomerId: customer })

    let watchPoints = 0

    switch (price) {
      case 599:
        watchPoints = 150000
        break

      case 999:
        watchPoints = 300000
        break

      case 1399:
        watchPoints = 450000
        break
      
      default:
        watchPoints = 0
    }
    
    await creditWatchPoints(userInstance, watchPoints, 'purchase')

    if (watchPoints > 0) {
      try {
        await sendMail({
          subject: 'buyfinder - Watch Points have been credited',
          text: `
            Hello,
  
            We send you this email to notify you that ${watchPoints} Watch Points have been successfully credited to your account.
  
            If you have any issue or question, do not hesitate to reply to this email.
          `,
          html: `
            Hello, <br />
            <br />
            We send you this email to notify you that ${watchPoints} Watch Points have been successfully credited to your account.<br />
            <br />
            If you have any issue or question, do not hesitate to reply to this email.
          `
        }, userInstance)
      } catch (error) {
        console.error('Couldn\'t send watch points credit email', error)
      }
    }
  } catch (error) {
    console.error('An error occured trying to update the watch points of customer', customer, 'with', price, error)

    throw new Error('An error occured trying to update the watch points')
  }
}
