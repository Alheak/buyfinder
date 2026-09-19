import { NextApiRequest, NextApiResponse } from "next"
import { getPricesDataset } from "../../../api/controllers/prices"
import getUserFromSession from "../../../api/utils/getUserFromSession"
import { DataPoint } from "../../../types/Price"

export default async function handler (req: NextApiRequest, res: NextApiResponse<DataPoint[]>) {
  try {
    const user = await getUserFromSession(req, res)

    if (!user || !user.hasActiveSubscription) {
      res.status(401).end()

      return
    }

    let { _id, shop, from, to, condition, percentile } = req.body

    if (from) from = new Date(from)
    if (to) to = new Date(to)

    const dataset: DataPoint[] = await getPricesDataset(_id, from, to, shop, condition, percentile)

    res.status(200).json(dataset)

    return
  } catch (error) {
    console.error('Error when getting price datasets', error)

    res.status(500).end()

    return
  }
}
