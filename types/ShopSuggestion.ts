import { Types } from "mongoose"
import { User } from "./User"

export interface ShopSuggestion {
  _id: Types.ObjectId
  user: User
  domain: string
}
