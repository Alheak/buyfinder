import { User } from "../../types/User"
import Users from "../models/User"
import WatchPointsCredits from "../models/WatchPointsCredit"

export async function creditWatchPoints (user: User, amount: number, reason: 'report' | 'purchase' | 'abuse') {
  try {
    const userInstance = await Users.findById(user._id)

    userInstance.watchPoints = (userInstance.watchPoints || 0) + amount

    await userInstance.save()

    await WatchPointsCredits.create({
      user: userInstance._id,
      amount,
      reason
    })

    // console.log(amount, `Watch Points have been ${amount >= 0 ? 'credited to' : 'deducted from'} user`, userInstance._id.toString(), 'for a', reason)

    return userInstance
  } catch (error) {
    console.error('Unable to credit', amount, 'watch points to user', user._id.toString(), 'for a', reason, ':', error)
  }
}
