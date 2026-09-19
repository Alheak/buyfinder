import { Types } from "mongoose"
import { NextApiRequest, NextApiResponse } from "next"
import { getNotifications } from "../../../api/controllers/notifications"
import getUserFromSession from "../../../api/utils/getUserFromSession"
import { Notification } from "../../../types/Notification"

export default async function handler (req: NextApiRequest, res: NextApiResponse<Notification[]>) {
  try {
    const user = await getUserFromSession(req, res)

    if (!user) {
      res.status(401).end()

      return
    }

    const isRead = req.query.isRead ? (req.query.isRead as string) === 'true' : undefined
    const limit = parseInt(req.query.limit as string || '10')
    const fromDocument = req.query.from ? new Types.ObjectId(req.query.from as string | undefined) : undefined
    const notifications: Notification[] = await getNotifications(user, limit, fromDocument, isRead)

    res.status(200).json(notifications)

    return
  } catch (error) {
    console.error('Error when getting notifications', error)

    res.status(500).end()

    return
  }
}
