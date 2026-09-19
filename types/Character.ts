import { Types } from "mongoose"

export interface Character {
  _id: Types.ObjectId
  mfcId: string
  name: string
  originalName?: string
  altNames?: string[]
}
