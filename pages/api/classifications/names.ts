// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getClassificationsNames } from '../../../api/controllers/classifications'

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<string[]>
) {
  try {
    const classifications = await getClassificationsNames()

    if (classifications) {
      res.status(200).json(classifications)

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
