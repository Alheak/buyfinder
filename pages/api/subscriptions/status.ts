import { NextApiRequest, NextApiResponse } from "next"
import getUserFromSession from "../../../api/utils/getUserFromSession"
import { subscriptionStatus } from "../../../api/controllers/subscriptions"

interface SubscriptionStatus {
  hasActiveSubscription: boolean
  subscriptionLevel: number
}

export default async function handler (req: NextApiRequest, res: NextApiResponse<SubscriptionStatus>) {
  try {
    const user = await getUserFromSession(req, res)

    if (!user) {
      res.status(401).end()

      return
    }

    const status: SubscriptionStatus = await subscriptionStatus(user)

    res.status(200).json(status)

    return
  } catch (error) {
    console.error('Error when getting subscription status', error)

    res.status(500).end()

    return
  }
}
