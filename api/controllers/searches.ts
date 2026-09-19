import Searches from "../models/Search"

const ONE_DAY = 1000 * 60 * 60 * 24
const ONE_MONTH = ONE_DAY * 30

export async function getSearches (
  from: Date = new Date(Date.now() - ONE_MONTH),
  to: Date = new Date()
) {
  try {
    const period = to.getTime() - from.getTime()
    const interval = period / 30
    const data = []
    const searches = await Searches.find({ createdAt: { $gte: from, $lte: to } }).lean()

    let walker = 0

    for (let i = 0; i < 30; i++) {
      const x = from.getTime() + i * interval

      let searchCount = 0

      while (!!searches[walker] && searches[walker].createdAt.getTime() < (x + interval)) {
        walker++
        searchCount++
      }

      data.push({
        x,
        y: searchCount
      })
    }

    return data
  } catch (error) {
    console.error('Error when trying to get searches', error)

    return []
  }
}