import { Types } from "mongoose"
import { Listing } from "./Listing"
import { Figure } from "./Figure"
import { User } from "./User"

export type ReportReason = 'wrong' | 'bootleg' | 'broken' | 'soldout' | 'price' | 'condition' | 'info' | 'other'

export interface ReportData {
  listingId?: string
  figureId?: string
  shop?: string
  type: 'falseNegative' | 'falsePositive'
  reason?: ReportReason
  comment?: string
  searchSuggestion?: string
  userCurrency?: string
}

export interface Report extends ReportData {
  _id: Types.ObjectId
  listing: Listing
  figure?: Figure
  user?: User
  isConfirmed: boolean
  shopSearches?: string[]
  createdAt?: Date
}

export function getReportOption (reportReason: ReportReason) {
  switch (reportReason) {
    case 'wrong':
      return 'Wrong item'

    case 'bootleg':
      return 'Item is a bootleg'

    case 'broken':
      return 'Link is broken'

    case 'soldout':
      return 'Product is sold out'

    case 'price':
      return 'Wrong price'

    case 'condition':
      return 'Wrong condition'

    case 'info':
      return 'Wrong price or condition'

    case 'other':
      return 'Other'

    default:
      return 'Other'
  }
}
