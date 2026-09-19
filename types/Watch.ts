import { Types } from "mongoose"
import { Figure } from "./Figure"
import { Listing } from "./Listing"
import { User } from "./User"

export type WatchFrequency = 600_000 | 1_800_000 | 3_600_000 | 7_200_000 | 10_800_000 | 14_400_000 | 21_600_000 | 28_800_000 | 43_200_000 | 86_400_000

export interface WatchOptions {
  searches: string[]
  mustContain: string[]
  exclude: string[]
}

export interface WatchData {
  figureId: string
  shopsToSearch?: string[]
  shopsToIgnore?: string[]
  maximumPrice?: number | null
  currency?: string
  newListings?: Listing[]
  activeSearch?: boolean
  frequency?: WatchFrequency
  lastCheck?: Date
  lastFound?: Date
  shopRules?: {
    [key: string]: WatchOptions
  }
}

export interface Watch extends WatchData {
  _id: Types.ObjectId
  figure: Figure
  user: User
  updatedAt: Date
}

const ONE_MINUTE = 1000 * 60
const ONE_HOUR = 1000 * 60 * 60
const ONE_DAY = 1000 * 60 * 60 * 24

export const frequencies = [ONE_MINUTE * 10, ONE_MINUTE * 30, ONE_HOUR, ONE_HOUR * 2, ONE_HOUR * 3, ONE_HOUR * 4, ONE_HOUR * 6, ONE_HOUR * 8, ONE_HOUR * 12, ONE_DAY]
