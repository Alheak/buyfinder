import mongoose from "mongoose"
import connectDB from "../api/utils/connectDB"
import Figures from "../api/models/Figure"
import Listings from "../api/models/Listing"
import Reports from "../api/models/Report"
import CleanupRequests from "../api/models/CleanupRequest"
import Searches from "../api/models/Search"
import ShopSearches from "../api/models/ShopSearch"
import Watches from "../api/models/Watch"
import NoHits from "../api/models/NoHit"
import elasticClient from "../api/utils/elasticClient"
import { Figure } from "../types/Figure"
import { barcodeRegex } from "../mixins/barcodeRegex"

(async () => {
  connectDB()

  async function merge (figures: Figure[], figureToKeep: Figure) {
    for (let j = 1; j < figures.length; j++) {
      const figureToMerge = figures[j]

      // console.log('Merging the following entry: ', figureToMerge)

      const listings = await Listings.find({ figure: figureToMerge._id })

      // console.log('Updating', listings.length, 'listings')

      for (let k = 0; k < listings.length; k++) {
        const listing = listings[k]

        // console.log('before', listing.figure)

        listing.figure = figureToKeep._id

        await listing.save()

        // console.log('after', listing.figure)
      }

      const reports = await Reports.find({ figure: figureToMerge._id })

      // console.log('Updating', reports.length, 'reports')

      for (let k = 0; k < reports.length; k++) {
        const report = reports[k]

        // console.log('before', report.figure)

        report.figure = figureToKeep._id

        await report.save()

        // console.log('after', report.figure)
      }

      const requests = await CleanupRequests.find({ figure: figureToMerge._id })

      // console.log('Updating', requests.length, 'cleanup requests')

      for (let k = 0; k < requests.length; k++) {
        const request = requests[k]

        // console.log('before', request.figure)

        request.figure = figureToKeep._id

        await request.save()

        // console.log('after', request.figure)
      }

      const nohits = await NoHits.find({ figure: figureToMerge._id })

      // console.log('Updating', nohits.length, 'nohits')

      for (let k = 0; k < nohits.length; k++) {
        const nohit = nohits[k]

        // console.log('before', nohit.figure)

        nohit.figure = figureToKeep._id

        await nohit.save()

        // console.log('after', nohit.figure)
      }

      const searches = await Searches.find({ figure: figureToMerge._id })

      // console.log('Updating', searches.length, 'searches')

      for (let k = 0; k < searches.length; k++) {
        const search = searches[k]

        // console.log('before', search.figure)

        search.figure = figureToKeep._id

        await search.save()

        // console.log('after', search.figure)
      }

      const shopSearches = await ShopSearches.find({ figure: figureToMerge._id })

      // console.log('Updating', shopSearches.length, 'shopSearches')

      for (let k = 0; k < shopSearches.length; k++) {
        const search = shopSearches[k]

        // console.log('before', search.figure)

        search.figure = figureToKeep._id

        await search.save()

        // console.log('after', search.figure)
      }

      const watches = await Watches.find({ figure: figureToMerge._id })

      // console.log('Updating', watches.length, 'watches')

      for (let k = 0; k < watches.length; k++) {
        const watch = watches[k]

        // console.log('before', watch.figure)

        watch.figure = figureToKeep._id

        await watch.save()

        // console.log('after', watch.figure)
      }

      // console.log('Deleting the entry', figureToMerge._id.toString())

      await Figures.deleteOne({ _id: figureToMerge._id })

      try {
        const result = await elasticClient.search({
          index: 'figures',
          query: {
            match: {
              id: {
                query: figureToMerge._id.toString()
              }
            }
          }
        })
  

        if (result && result.hits.hits[0]._id) {
          const indexedDocId = result.hits.hits[0]._id
    
          // console.log('Deleting indexed document', indexedDocId)
    
          await elasticClient.delete({
            index: 'figures',
            id: indexedDocId
          })
        }
      } catch (error) {
        console.error('Couldn\'t delete the indexed document for figure', figureToMerge._id.toString(), error)
      }
    }
  }

  const urls = await Figures.aggregate([
    {
      '$match': {
        '$and': [
          {
            'mfcLink': {
              '$ne': ''
            }
          }, {
            'mfcLink': {
              '$exists': true
            }
          }
        ]
      }
    }, {
      '$group': {
        '_id': '$mfcLink', 
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

  // console.log('Found', urls.length, 'mfc links used in multiple figure entries.')

  for (let i = 0; i < urls.length; i++) {
    const { _id: mfcLink } = urls[i]
    const figures: Figure[] = await Figures.find({ mfcLink }).sort({ createdAt: 1 })

    if (figures.length < 2) continue

    const figureToKeep = figures[0]

    // console.log('Keeping the following entry: ', figureToKeep)

    await merge(figures, figureToKeep)
  }

  // const jans = await Figures.aggregate([
  //   {
  //     '$match': {
  //       'releases.jan': {
  //         '$exists': true,
  //         '$ne': ''
  //       }
  //     }
  //   }, {
  //     '$group': {
  //       '_id': {
  //         'jan': '$releases.jan',
  //         'mfcLink': '$mfcLink'
  //       }, 
  //       'count': {
  //         '$sum': 1
  //       }
  //     }
  //   }, {
  //     '$sort': {
  //       'count': -1
  //     }
  //   }, {
  //     '$match': {
  //       'count': {
  //         '$gte': 2
  //       }
  //     }
  //   }
  // ])

  // console.log('Found', jans.length, 'JANs used in multiple figure entries.')

  // for (let i = 0; i < jans.length; i++) {
  //   const { _id: jan } = jans[i]

  //   let figures: Figure[] = await Figures.find({ 'releases.jan': jan }).sort({ createdAt: 1 })

  //   if (figures.length < 2) continue

  //   const figureToKeep = figures.filter(figure => figure.title && !barcodeRegex.test(figure.title))[0] || figures[0]

  //   // console.log('Keeping the following entry: ', figureToKeep)

  //   await merge(figures, figureToKeep)
  // }

  // console.log('Done')

  await elasticClient.close()

  mongoose.connections[mongoose.connections.length - 1].close()
})()
