// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { addSearch } from '../../../api/controllers/reports'
import getUserFromSession from '../../../api/utils/getUserFromSession'

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<string[]>
) {
  try {
    const user = await getUserFromSession(req, res)

    if (!user || !user.admin) {
      res.status(403).end()

      return
    }

    const { shop, figure, searchSuggestion } = req.body

    const searches = await addSearch(shop, figure, searchSuggestion)

    res.status(200).json(searches)

    return
  } catch (error) {
    console.error(error)

    res.status(500).end()

    return
  }
}
