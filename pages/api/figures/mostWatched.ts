// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getMostWatchedFigures } from '../../../api/controllers/figures'
import { Figure } from '../../../types/Figure'

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<Figure[]>
) {
  try {
    const mostWatched = await getMostWatchedFigures()

    res.status(200).json(mostWatched)
  } catch (error) {
    console.error(error)

    res.status(500).json([])

    return
  }
}
