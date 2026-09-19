// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getMostSearchedFigures } from '../../../api/controllers/figures'
import { Figure } from '../../../types/Figure'

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<Figure[]>
) {
  try {
    const mostSearched = await getMostSearchedFigures()

    res.status(200).json(mostSearched)
  } catch (error) {
    console.error(error)

    res.status(500).json([])

    return
  }
}
