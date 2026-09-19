import { Types } from "mongoose"
import { Figure } from "./Figure"

export type Listing = {
  _id: Types.ObjectId
  id?: string
  figure: Figure
  title?: string
  shop: string
  price: number
  currency: string
  condition: 'new' | 'used'
  seller?: string
  url: string
  isDomesticShippingOnly?: boolean
  isAccurate?: boolean
  isWrong?: boolean
  isActive?: boolean
  priceIsTBD?: boolean
  searchUsed?: string
  lastCheck?: Date
  createdAt?: Date
  updatedAt?: Date
}

export type ListingsByShop = [string, Listing[], number | null, number?] // [shop, listings, nextSearch (timestamp), lastSearch (timestamp)]

export interface CachedListings {
  listings: Listing[]
  lastSearch?: number
  nextSearch: number | null
}
