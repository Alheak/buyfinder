// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { searchFigures } from '../../../api/controllers/figures'
import type { Figure } from '../../../types/Figure'

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<Figure[]>
) {
  try {
    const query = req.query.query as string
    const figures = await searchFigures(query, undefined, 5)

    if (figures) {
      res.status(200).json(figures)

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
