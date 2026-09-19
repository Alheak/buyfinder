import { Types } from "mongoose"
import { Figure } from "./Figure"
import { Listing } from "./Listing"

export interface DataPoint {
  x: string
  y: number
}

export interface PricePoint {
  figure: Figure
  price: number
  yearMonth: string,
  condition: 'all' | 'used' | 'new',
  percentile?: number,
  shop?: string
}

export interface PriceDatasets {
  [key: string]: DataPoint[]
}

export interface Price {
  _id: Types.ObjectId
  listing: Listing
  price: number
  currency: string
  createdAt: Date
  updatedAt: Date
}
