// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getFigure } from '../../../api/controllers/figures'
import getUserFromSession from '../../../api/utils/getUserFromSession'
import { Figure } from '../../../types/Figure'

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<Figure>
) {
  try {
    const user = await getUserFromSession(req, res)

    if (!user || !user.admin) {
      res.status(403).end()

      return
    }

    const _id = req.query._id as string

    if (!_id) {
      res.status(400).end()

      return
    }

    const figure: Figure = await getFigure(_id, undefined, false)

    if (figure) {
      res.status(200).json(figure)

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
