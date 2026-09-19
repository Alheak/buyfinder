// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getCachedListings } from '../../../api/controllers/listings'
import type { ListingsByShop } from '../../../types/Listing'

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<ListingsByShop[]>
) {
  try {
    const _id = req.query._id as string
    const listingsByShops: ListingsByShop[] = await getCachedListings(_id)

    if (listingsByShops) {
      res.status(200).json(listingsByShops)

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
