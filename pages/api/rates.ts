// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import getExchangeRates from '../../api/utils/getExchangeRates'
import checkRequestOrigin from '../../api/utils/checkRequestOrigin'

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!checkRequestOrigin(req)) {
      res.status(403).end()

      return
    }

    const currency = `${req.query.currency}`.toUpperCase()

    if (!/[A-Z]{3}/.test(currency)) {
      res.status(401).end()

      return
    }

    const exchangeRates = await getExchangeRates(currency)

    if (exchangeRates) {
      res.status(200).json(exchangeRates)

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
