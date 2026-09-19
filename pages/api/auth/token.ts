// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from '../../../api/controllers/tokens'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ tokenIsValid: boolean }>
) {
  try {
    const token = `${req.query.token}`
    const tokenDoc = await getToken(token)

    if (!tokenDoc) {
      res.status(404).json({ tokenIsValid: false })

      return
    }

    res.status(200).json({ tokenIsValid: true })

    return
  } catch (error: any) {
    console.error(error)

    res.status(500).end()

    return
  }
}
