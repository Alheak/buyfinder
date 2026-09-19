// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { setListingValidity } from '../../../api/controllers/listings'
import type { Listing } from '../../../types/Listing'
import getUserFromSession from '../../../api/utils/getUserFromSession'

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<Listing>
) {
  try {
    const user = await getUserFromSession(req, res)

    if (!user || !user.admin) {
      res.status(403).end()

      return
    }

    const { _id, isWrong } = req.body
    const listing: Listing = await setListingValidity(_id, isWrong)

    if (listing) {
      res.status(200).json(listing)

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
