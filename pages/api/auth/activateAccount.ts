// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { confirmUser } from '../../../api/controllers/users'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ tokenIsValid: boolean }>
) {
  try {
    const token = `${req.query.token}`

    try {
      await confirmUser(token)
    } catch (error) {
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
