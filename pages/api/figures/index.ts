// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getFigures } from '../../../api/controllers/figures'
import type { Figure } from '../../../types/Figure'

const SEARCH_PARAMS = ['search', 'category', 'classification', 'origin', 'manufacturer']

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<Figure[]>
) {
  try {
    const searchParams: { [key: string]: string } = {}

    for (let i = 0; i < SEARCH_PARAMS.length; i++) {
      const SEARCH_PARAM = SEARCH_PARAMS[i]
      
      if (req.query[SEARCH_PARAM]) searchParams[SEARCH_PARAM] = req.query[SEARCH_PARAM] as string
    }

    const sort = req.query.sort as string || 'added'
    const order = req.query.order as ('asc' | 'desc') || 'desc'
    const page = parseInt(req.query.page as string || '0')
    const figures = await getFigures(searchParams, sort, order, page)

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
