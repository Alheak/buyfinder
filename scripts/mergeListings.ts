import mongoose from "mongoose"
import connectDB from "../api/utils/connectDB"
import Listings from "../api/models/Listing"
import Reports from "../api/models/Report"
import Watches from "../api/models/Watch"
import Prices from "../api/models/Price"
import { Types } from "mongoose"

(async () => {
  connectDB()

  const entries = await Listings.aggregate([
    {
      '$match': {
        '$and': [
          {
            'figure': {
              '$ne': null
            }
          }, {
            'figure': {
              '$exists': true
            }
          },
          {
            'url': {
              '$ne': ''
            }
          }, {
            'url': {
              '$exists': true
            }
          },
          {
            'condition': {
              '$ne': ''
            }
          }, {
            'condition': {
              '$exists': true
            }
          }
        ]
      }
    }, {
      '$group': {
        '_id': {
          'figure': '$figure',
          'url': '$url',
          'condition': '$condition',
          'seller': '$seller'
        }, 
        'count': {
          '$sum': 1
        }
      }
    }, {
      '$sort': {
        'count': -1
      }
    }, {
      '$match': {
        'count': {
          '$gte': 2
        }
      }
    }
  ])

  // console.log('Found', entries.length, 'listings with duplicate entries.')

  for (let i = 0; i < entries.length; i++) {
    const { _id: { figure, url, condition, seller } } = entries[i]
    const listings = await Listings.find({ figure, url, condition, seller }).sort({ updatedAt: -1 })

    if (listings.length < 2) continue

    const listingToKeep = listings[0]

    // console.log('Keeping the following entry: ', listingToKeep)

    for (let j = 1; j < listings.length; j++) {
      const listingToMerge = listings[j]

      // console.log('Merging the following entry: ', listingToMerge)

      const reports = await Reports.find({ listing: listingToMerge._id })

      // console.log('Updating', reports.length, 'reports')

      for (let k = 0; k < reports.length; k++) {
        const report = reports[k]

        // console.log('before', report.listing)

        report.listing = listingToKeep._id

        await report.save()

        // console.log('after', report.listing)
      }

      const prices = await Prices.find({ listing: listingToMerge._id })

      // console.log('Updating', prices.length, 'prices')

      for (let k = 0; k < prices.length; k++) {
        const price = prices[k]

        // console.log('before', price.listing)

        price.listing = listingToKeep._id

        await price.save()

        // console.log('after', price.listing)
      }

      const watches = await Watches.find({ newListings: listingToMerge._id })

      // console.log('Updating', watches.length, 'watches')

      for (let k = 0; k < watches.length; k++) {
        const watch = watches[k]

        // console.log('before', watch.newListings)

        const newListings = watch.newListings.map((newListing: Types.ObjectId) => newListing.toString() === listingToMerge._id.toString() ? listingToKeep._id : newListing)
        const newListingsSet: Set<Types.ObjectId> = new Set(newListings)

        watch.newListings = [...newListingsSet]

        await watch.save()

        // console.log('after', watch.newListings)
      }

      // console.log('Deleting the entry', listingToMerge._id.toString())

      await Listings.deleteOne({ _id: listingToMerge._id })
    }
  }

  // console.log('Done')

  mongoose.connections[mongoose.connections.length - 1].close()
})()
