import mongoose from "mongoose"
import connectDB from "../api/utils/connectDB"
import Listings from "../api/models/Listing"
import { shops } from "../data/shops"

(async () => {
  if (process.argv.length < 3) {
    console.error('Please provide a shop.')

    process.abort()
  }

  const shop = process.argv[2]
  const shopInfo = shops[shop]

  if (!shopInfo.urlRemoveParams) {
    console.error('No params to remove.')

    process.abort()
  }

  connectDB()

  const listings = await Listings.find({ shop })

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i]
    const url = new URL(listing.url)

    for (let j = 0; j < shopInfo.urlRemoveParams.length; j++) {
      const paramToRemove = shopInfo.urlRemoveParams[j]
      
      url.searchParams.delete(paramToRemove)
    }

    // console.log('url before', listing.url)

    listing.url = url.toString().replace(/\#$/, '')

    await listing.save()

    // console.log('url after', listing.url)
  }

  mongoose.connections[mongoose.connections.length - 1].close()
})()
