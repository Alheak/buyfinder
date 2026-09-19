import { NextApiRequest, NextApiResponse } from "next"
import { createListing } from "../../../api/controllers/listings"
import getUserFromSession from "../../../api/utils/getUserFromSession"
import { Listing } from "../../../types/Listing"

export default async function handler (req: NextApiRequest, res: NextApiResponse<Listing>) {
  try {
    const user = await getUserFromSession(req, res)

    if (!user || !user.admin) {
      res.status(403).end()

      return
    }

    const listing: Listing = await createListing(req.body)

    if (listing) {
      res.status(200).json(listing)

      return
    }

    res.status(404).end()
  } catch (error) {
    console.error('Error when creating the listing', error)

    res.status(500).end()
  }
}
