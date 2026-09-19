// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getUser, passwordReset } from '../../../api/controllers/users'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const email = `${req.query.email}`
    const user = await getUser(email)

    if (!user) {
      res.status(200).end()

      return
    }

    await passwordReset(user)

    res.status(200).end()

    return
  } catch (error: any) {
    console.error(error)

    res.status(500).end()

    return
  }
}
