// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getFigure } from '../../../api/controllers/figures'
import type { Figure } from '../../../types/Figure'
import getUserFromSession from '../../../api/utils/getUserFromSession'
import Searches from '../../../api/models/Search'
import updateFigureCacheWithPriceData from '../../../api/utils/updateFigureCacheWithPriceData'
import { Types } from 'mongoose'

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<Figure>
) {
  try {
    const _id = `${req.query._id || ''}`
    const user = await getUserFromSession(req, res)

    let figure: Figure = await getFigure(_id, user)

    if (figure) {
      if (req.query.isSearch) {
        const query: {
          figure: Types.ObjectId
          user?: Types.ObjectId
        } = { figure: figure._id }

        if (!!user) query.user = user._id

        await Searches.create(query)
      }

      figure = await updateFigureCacheWithPriceData(figure)

      res.status(200).json(figure)

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
