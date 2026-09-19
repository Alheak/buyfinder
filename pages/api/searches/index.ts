import { NextApiRequest, NextApiResponse } from "next"
import { getSearches } from "../../../api/controllers/searches"
import getUserFromSession from "../../../api/utils/getUserFromSession"

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getUserFromSession(req, res)

    if (!user || !user.admin) {
      res.status(403).end()

      return
    }

    const from = req.query.from as string | undefined
    const to = req.query.to as string | undefined
    const searches = await getSearches(
      from ? new Date(parseInt(from)) : undefined,
      to ? new Date(parseInt(to)) : undefined
    )

    res.status(200).json(searches)

    return
  } catch (error) {
    console.error('Error when getting searches', error)

    res.status(500).end()

    return
  }
}
