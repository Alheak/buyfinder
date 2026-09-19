// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { changeEmail } from '../../../api/controllers/users'
import getUserFromSession from "../../../api/utils/getUserFromSession"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const user = await getUserFromSession(req, res)
    const { newEmail, password } = req.body

    if (!user) {
      res.status(400).end()

      return
    }

    await changeEmail(user, newEmail, password)

    res.status(200).end()

    return
  } catch (error: any) {
    console.error(error)

    res.status(500).end()

    return
  }
}
