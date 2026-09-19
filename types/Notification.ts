import { Types } from "mongoose"
import { User } from "./User"

export interface Notification {
  _id: Types.ObjectId
  user: User
  message?: string
  route?: string
  isRead?: boolean
  createdAt: Date
}
