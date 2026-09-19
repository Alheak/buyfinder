import { Character } from "../../types/Character"
import { Release } from "../../types/Figure"
import Characters from '../models/Character'
import Origins from '../models/Origin'
import getExchangeRates from "./getExchangeRates"

export default async function getDocForIndexing (figure: any) {
  const document: any = {
    id: figure._id.toString(),
    slug: figure.slug,
    name: figure.name,
    char: figure.char,
    title: figure.title,
    origin: figure.origin,
    version: figure.version,
    classification: figure.classification,
    category: figure.category,
    scale: figure.scale,
    manufacturer: figure.manufacturer,
    image: figure.image,
    releases: figure.releases.map((release: Release) => ({ date: new Date(release.date || '') })),
    jp: {
      char: figure.jp.char,
      manufacturer: figure.jp.manufacturer,
      title: figure.jp.title,
      version: figure.jp.version,
      origin: figure.jp.origin,
      classification: figure.jp.classification
    },
    priceData: {
      searchCount: 0,
      averagePrice: 0,
      minPrice: 0,
      maxPrice: 0,
      priceChange: 0,
    },
    createdAt: figure.createdAt
  }

  if (figure.priceData) {
    document.priceData.searchCount = figure.priceData.searchCount
    document.priceData.averagePrice = figure.priceData.averagePrice
    document.priceData.minPrice = figure.priceData.minPrice
    document.priceData.maxPrice = figure.priceData.maxPrice
    document.priceData.priceChange = figure.priceData.priceChange
  } else {
    const releaseWithPrice = figure.releases.find((release: Release) => !!release.price)

    if (!!releaseWithPrice) {
      const exchangeRates = await getExchangeRates('JPY')
      const price = releaseWithPrice.price / exchangeRates[releaseWithPrice.currency?.toUpperCase() || 'JPY']

      document.priceData.averagePrice = price
      document.priceData.minPrice = price
      document.priceData.maxPrice = price
    }
  }

  if (figure.chars && figure.chars.length) {
    const chars: Character[] = await Characters.find({ _id: { $in: figure.chars } })

    document.char += ' ' + chars.filter(char => !!char && !!char.altNames).map(char => char.altNames?.join(' ')).join(' ')
  }

  if (figure.origin) {
    const origin = await Origins.findOne({ name: figure.origin })

    if (origin) document.origin += ' ' + origin.altNames?.join(' ')
  }

  return document
}
