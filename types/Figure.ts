import { Types } from "mongoose"
import type { Listing } from "./Listing"
import { Watch } from "./Watch"
import { Character } from "./Character"

export interface PriceData {
  searchCount?: number
  startingPrice: number
  averagePrice: number
  priceChange: number
  minPrice?: number
  maxPrice?: number
}

export interface Release {
  date?: string
  price?: number
  currency?: string
  jan?: string
}

export interface FigureData {
  char?: string
  manufacturer?: string
  distributor?: string
  sculptor?: string
  title?: string
  version?: string
  origin?: string
  classification?: string
  numbering?: string
}

export interface FigureInfos extends FigureData {
  category?: string
  jan?: string
  name: string
  chars?: (Types.ObjectId | Character)[]
  image?: string
  images?: string[]
  releases: Release[]
  scale?: string
  mfcLink?: string | null
  jp: FigureData
}

export interface Figure extends FigureInfos {
  _id: Types.ObjectId
  slug?: string
  listings?: Listing[]
  bestPrice?: Listing
  watch?: Watch
  priceData?: PriceData
}
