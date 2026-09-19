import { NextApiRequest, NextApiResponse } from "next"
import { getCleanupRequests } from "../../../api/controllers/cleanupRequests"
import getUserFromSession from "../../../api/utils/getUserFromSession"
import { CleanupRequest } from "../../../types/CleanupRequest"

export default async function handler (req: NextApiRequest, res: NextApiResponse<CleanupRequest[]>) {
  try {
    const user = await getUserFromSession(req, res)

    if (!user || !user.admin) {
      res.status(403).end()

      return
    }

    const cleanupRequests: CleanupRequest[] = await getCleanupRequests()

    res.status(200).json(cleanupRequests)
  } catch (error) {
    console.error('Error when getting cleanupRequests', error)

    res.status(500).end()
  }
}
