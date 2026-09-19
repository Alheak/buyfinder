import mongoose from "mongoose"
import connectDB from "../api/utils/connectDB"
import Watches from "../api/models/Watch"
import Listings from "../api/models/Listing"
import { Types } from "mongoose"

(async () => {
  connectDB()

  const watches = await Watches.find({ 'newListings.1': { $exists: true } })

  for (let i = 0; i < watches.length; i++) {
    const watch = watches[i]

    for (let j = 0; j < watch.newListings.length; j++) {
      const listingId = watch.newListings[j]
      const listing = await Listings.findById(listingId)

      if (!listing) {
        // console.log('Found orphaned listing', listingId)
        watch.newListings[j] = null
      }
    }

    watch.newListings = watch.newListings.filter((listing: Types.ObjectId) => !!listing)

    await watch.save()
  }
  
  mongoose.connections[mongoose.connections.length - 1].close()
})()
