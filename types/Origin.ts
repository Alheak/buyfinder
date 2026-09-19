import { Types } from "mongoose"

export interface Origin {
  _id: Types.ObjectId
  name: string
  altNames?: string[]
}
