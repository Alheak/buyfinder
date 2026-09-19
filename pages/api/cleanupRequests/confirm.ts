// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { confirmCleanupRequest } from '../../../api/controllers/cleanupRequests'
import type { CleanupRequest } from '../../../types/CleanupRequest'
import getUserFromSession from '../../../api/utils/getUserFromSession'

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<CleanupRequest>
) {
  try {
    const user = await getUserFromSession(req, res)

    if (!user || !user.admin) {
      res.status(403).end()

      return
    }

    const { _id } = req.body
    const cleanupRequest: CleanupRequest = await confirmCleanupRequest(_id)

    if (cleanupRequest) {
      res.status(200).json(cleanupRequest)

      return
    }

    res.status(404).end()

    return
  } catch (error) {
    console.error(error)

    res.status(500).end()

    return
  }
}
