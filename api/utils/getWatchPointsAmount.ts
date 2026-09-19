import { shops } from "../../data/shops"
import { Figure } from "../../types/Figure"
import Searches from "../models/Search"

const MIN_WATCH_POINTS_PER_REPORT = 12
const MIN_WATCH_POINTS_PER_REPORT_IF_JAN = 60
const MAX_WATCH_POINTS_PER_REPORT = 120
const MAX_NUMBER_OF_SEARCHES_FOR_FULL_PAYOUT = 200

export default async function getWatchPointsAmount (figure: Figure, shop: string) {
  const figureHasJan = !!figure.releases?.find(release => !!release.jan)

  let hasJan = false

  if (figureHasJan && shops[shop].searchTerms?.includes('jan')) hasJan = true

  let watchPointsAmount = hasJan ? MIN_WATCH_POINTS_PER_REPORT_IF_JAN : MIN_WATCH_POINTS_PER_REPORT

  try {
    const searchesAmount = await Searches.countDocuments({ figure: figure._id })

    watchPointsAmount += Math.min(MAX_NUMBER_OF_SEARCHES_FOR_FULL_PAYOUT, searchesAmount) / MAX_NUMBER_OF_SEARCHES_FOR_FULL_PAYOUT * (MAX_WATCH_POINTS_PER_REPORT - watchPointsAmount)
  } catch (error) {
    console.error('Couldn\'t get the amount of watch points to give for figure', figure._id.toString(), ':', error)
  }

  return Math.ceil(watchPointsAmount)
}
