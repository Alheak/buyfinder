import { NextApiRequest, NextApiResponse } from "next"
import Figures from "../../../api/models/Figure"
import getWatchPointsAmount from "../../../api/utils/getWatchPointsAmount"

export default async function handler (req: NextApiRequest, res: NextApiResponse<number>) {
  try {
    const _id = `${req.query.figure || ''}`
    const shop = `${req.query.shop || ''}`
    const figure = await Figures.findById(_id)
    const watchPointsAmount = await getWatchPointsAmount(figure, shop)

    res.status(200).json(watchPointsAmount)
  } catch (error) {
    console.error('Error when getting watch points amount', error)

    res.status(500).end()
  }
}
