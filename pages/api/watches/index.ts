import { NextApiRequest, NextApiResponse } from "next"
import { getWatches } from "../../../api/controllers/watches"
import getUserFromSession from "../../../api/utils/getUserFromSession"
import { Watch } from "../../../types/Watch"

export default async function handler (req: NextApiRequest, res: NextApiResponse<Watch[]>) {
  try {
    const user = await getUserFromSession(req, res)

    if (!user) {
      res.status(401).end()

      return
    }

    const limit = parseInt(req.query.limit as string || '20')
    const fromDate = req.query.from ? new Date(req.query.from as string) : undefined
    const activeSearch = req.query.activeSearch ? (req.query.activeSearch as string) === 'true' : undefined
    const watches: Watch[] = await getWatches(user, limit, fromDate, activeSearch)

    res.status(200).json(watches)

    return
  } catch (error) {
    console.error('Error when getting watches', error)

    res.status(500).end()

    return
  }
}
