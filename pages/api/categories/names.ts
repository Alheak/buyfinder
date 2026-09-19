// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getCategoriesNames } from '../../../api/controllers/categories'

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<string[]>
) {
  try {
    const categories = await getCategoriesNames()

    if (categories) {
      res.status(200).json(categories)

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
