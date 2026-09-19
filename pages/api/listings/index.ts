// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { Types } from "mongoose"
import type { NextApiRequest, NextApiResponse } from 'next'
import { getListings } from '../../../api/controllers/listings'
import checkRequestOrigin from '../../../api/utils/checkRequestOrigin'
import getUserFromSession from '../../../api/utils/getUserFromSession'
import type { Listing, ListingsByShop } from '../../../types/Listing'
import Figures from '../../../api/models/Figure'

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<{figure: Types.ObjectId, results: ListingsByShop}>
) {
  try {
    if (!checkRequestOrigin(req)) {
      res.status(403).end()

      return
    }

    const shop = req.query.shop as string

    let _id = req.query._id as string

    if (/[\w\-]+/.test(_id)) {
      const figure = await Figures.findOne({ slug: _id })
  
      if (figure) _id = figure._id.toString()
    }

    if (!shop || /[^a-z0-9]/.test(shop)) {
      res.status(401).end()

      return
    }

    const user = await getUserFromSession(req, res)
    const forwarded = req.headers["x-forwarded-for"] as string
    const ip = forwarded ? forwarded.split(/, /)[0] : req.socket.remoteAddress

    const results: ListingsByShop = await getListings(shop, _id, ip, user)

    if (results) {
      res.status(200).json({ figure: new Types.ObjectId(_id), results })

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
