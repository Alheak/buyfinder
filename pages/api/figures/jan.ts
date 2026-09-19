// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getFigureFromJan } from '../../../api/controllers/figures'
import { barcodeRegex } from '../../../mixins/barcodeRegex'

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
  try {
    const jan = req.query.jan as string

    if (!jan || !barcodeRegex.test(jan)) {
      res.status(400).end()

      return
    }

    // console.log('Request received: ', jan)

    const figure = await getFigureFromJan(jan)

    if (figure) {
      res.status(200).json(figure.slug || figure._id.toString())

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
