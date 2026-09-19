import { NextApiRequest, NextApiResponse } from "next"
import getUserFromSession from '../../../api/utils/getUserFromSession'
import { createCleanupRequest } from "../../../api/controllers/cleanupRequests"

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getUserFromSession(req, res)

    if (!user) {
      res.status(403).end()

      return
    }

    await createCleanupRequest(req.body, user)

    res.status(200).end()

    return
  } catch (error) {
    console.error('Error when creating clean-up request', error)

    res.status(500).end()

    return
  }
}
