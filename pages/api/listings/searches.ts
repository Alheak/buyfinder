// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getListingSearches } from '../../../api/controllers/listings'

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<string[]>
) {
  try {
    const shop = req.query.shop as string
    const figure = req.query.figure as string
    const listingSearches: string[] = await getListingSearches(shop, figure)

    if (listingSearches) {
      res.status(200).json(listingSearches)

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
