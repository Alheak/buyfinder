import { Types } from "mongoose"
import { Figure } from "./Figure"

export interface CleanupRequestData {
  figureId: string
}

export interface CleanupRequest {
  _id: Types.ObjectId
  figure: Figure
  isDone: boolean
}
