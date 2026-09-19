// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { resetPassword } from '../../../api/controllers/users'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { token, password } = req.body

    await resetPassword(token, password)

    res.status(200).end()

    return
  } catch (error: any) {
    console.error(error)

    res.status(500).end()

    return
  }
}
