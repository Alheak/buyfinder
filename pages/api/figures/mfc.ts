// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getFigureFromMFCLink } from '../../../api/controllers/figures'
import { mfcLinkRegex } from '../../../mixins/mfcLinkRegex'
import { Figure } from '../../../types/Figure'

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
  try {
    const item = req.query.item as string

    if (!item) {
      res.status(400).end()

      return
    }

    // console.log('Request received: ', item)

    let link = `https://myfigurecollection.net/item/${item}`

    if (!mfcLinkRegex.test(link)) {
      res.status(400).end()

      return
    }

    const figure: Figure = await getFigureFromMFCLink(link)

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
