import { NextApiRequest, NextApiResponse } from "next"
import { JobJson } from 'bullmq'
import { getQueues } from "../../../api/controllers/queues"
import getUserFromSession from "../../../api/utils/getUserFromSession"

export default async function handler (req: NextApiRequest, res: NextApiResponse<{ [key: string]: JobJson[] }>) {
  try {
    const user = await getUserFromSession(req, res)

    if (!user || !user.admin) {
      res.status(403).end()

      return
    }

    const queues: { [key: string]: JobJson[] } = await getQueues()

    res.status(200).json(queues)
  } catch (error) {
    console.error('Error when getting queues', error)

    res.status(500).end()
  }
}
