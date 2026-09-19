import { NextApiRequest, NextApiResponse } from "next"
import { createWatch } from "../../../api/controllers/watches"
import getUserFromSession from "../../../api/utils/getUserFromSession"
import { Watch } from "../../../types/Watch"

export default async function handler (req: NextApiRequest, res: NextApiResponse<Watch>) {
  try {
    const user = await getUserFromSession(req, res)

    if (!user) {
      res.status(401).end()

      return
    }

    const data = req.body
    const watch: Watch = await createWatch(user, data)

    res.status(200).json(watch)

    return
  } catch (error) {
    console.error('Error when creating watch', error)

    res.status(500).end()

    return
  }
}
