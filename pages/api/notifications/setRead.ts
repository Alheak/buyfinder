// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { setNotificationRead } from '../../../api/controllers/notifications'
import type { Notification } from '../../../types/Notification'
import getUserFromSession from '../../../api/utils/getUserFromSession'

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<Notification>
) {
  try {
    const user = await getUserFromSession(req, res)

    if (!user) {
      res.status(403).end()

      return
    }

    const { _id } = req.body
    const notification: Notification = await setNotificationRead(user, _id)

    if (notification) {
      res.status(200).json(notification)

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
