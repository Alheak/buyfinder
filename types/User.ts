import { Types } from "mongoose"

export type User = {
  _id: Types.ObjectId
  email: string
  hasActiveSubscription?: boolean
  remainingActiveSearches?: number
  subscriptionLevel?: number
  watchPoints?: number
  watchPointsSubscription?: boolean
  admin?: boolean
  activated?: boolean
  notificationCount?: number
}
