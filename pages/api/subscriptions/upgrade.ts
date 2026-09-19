import { NextApiRequest, NextApiResponse } from "next"
import getUserFromSession from "../../../api/utils/getUserFromSession"
import { upgradeSubscription } from "../../../api/controllers/subscriptions"


export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getUserFromSession(req, res)

    if (!user) {
      res.status(401).end()
  
      return
    }

    await upgradeSubscription(user)

    res.status(200).end()
  } catch (error) {
    console.error(error)

    res.status(500).end()
  }
}
