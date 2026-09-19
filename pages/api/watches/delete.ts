import { NextApiRequest, NextApiResponse } from "next"
import { deleteWatch } from "../../../api/controllers/watches"
import getUserFromSession from "../../../api/utils/getUserFromSession"
import { Watch } from "../../../types/Watch"

export default async function handler (req: NextApiRequest, res: NextApiResponse<Watch>) {
  try {
    const user = await getUserFromSession(req, res)

    if (!user) {
      res.status(401).end()

      return
    }

    const { figureId } = req.body
    const watch: Watch = await deleteWatch(user, figureId)

    res.status(200).json(watch)

    return
  } catch (error) {
    console.error('Error when deleting watch', error)

    res.status(500).end()

    return
  }
}
