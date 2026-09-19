import { Types } from "mongoose"
import { CleanupRequest, CleanupRequestData } from "../../types/CleanupRequest"
import { User } from "../../types/User"
import CleanupRequests from "../models/CleanupRequest"
import { createNotification } from "./notifications"

export async function getCleanupRequests () {
  try {
    const cleanupRequests: CleanupRequest[] = await CleanupRequests.find({
      isDone: {
        $ne: true
      }
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate([
      'figure'
    ])

    return cleanupRequests
  } catch (error) {
    console.error('Error when getting clean-up requests', error)

    throw new Error('Error when getting clean-up requests')
  }
}

export async function createCleanupRequest (cleanupRequestData: CleanupRequestData, user: User) {
  try {
    const figure = cleanupRequestData.figureId ? new Types.ObjectId(cleanupRequestData.figureId) : null

    const report = await CleanupRequests.create({
      figure,
      user
    })

    return report
  } catch (error) {
    console.error('Error when creating a new clean-up request', cleanupRequestData, error)

    throw new Error('Error when creating a new clean-up request')
  }
}

export async function confirmCleanupRequest (_id: Types.ObjectId) {
  try {
    const cleanupRequest = await CleanupRequests.findById(_id).populate(['figure', 'user'])

    cleanupRequest.isDone = true

    await cleanupRequest.save()
    
    await createNotification(
      cleanupRequest.user,
      `The price data clean-up for ${cleanupRequest.figure.name} you requested has been completed.`,
      `/figure/${cleanupRequest.figure.slug || cleanupRequest.figure._id.toString()}`
    )

    return cleanupRequest
  } catch (error) {
    console.error('Error when confirming the clean-up request', _id.toString(), error)

    throw new Error('Error when confirming the clean-up request')
  }
}
