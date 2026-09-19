// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getManufacturersNames } from '../../../api/controllers/manufacturers'

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<string[]>
) {
  try {
    const manufacturers = await getManufacturersNames()

    if (manufacturers) {
      res.status(200).json(manufacturers)

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
