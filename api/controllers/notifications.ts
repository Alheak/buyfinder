import { User } from "../../types/User"
import Notifications from "../models/Notification"
import { Notification } from "../../types/Notification"
import { FilterQuery, Types } from "mongoose"

export async function getNotifications (user: User, limit: number = 10, fromDocument?: Types.ObjectId, isRead?: boolean) {
  try {
    const query: FilterQuery<any> = { user: user._id }

    if (isRead !== undefined) query.isRead = isRead || { $ne: true }
    if (!!fromDocument) query._id = { $lt: fromDocument }

    const notifications: Notification[] = await Notifications.find(query)
      .sort({ _id: -1 })
      .limit(limit)

    return notifications
  } catch (error) {
    console.error('Couldn\'t get notifications for user', user, error)

    throw new Error('Couldn\'t get notifications')
  }
}

export async function createNotification (user: User, message: string, route?: string) {
  try {
    const notification = await Notifications.create({
      user: user._id,
      message,
      route
    })

    return notification
  } catch (error) {
    console.error('Couldn\'t create notification "', message, '" for user', user)

    return null
  }
}

export async function setNotificationRead (user: User, _id: Types.ObjectId) {
  try {
    const notification = await Notifications.findOne({
      _id,
      user: user._id
    })

    notification.isRead = true

    await notification.save()

    return notification
  } catch (error) {
    console.error('Couldn\'t set notification', _id, 'as read for user', user, error)

    throw new Error('Couldn\'t set notifications')
  }
}

export async function setAllNotificationsRead (user: User) {
  try {
    await Notifications.updateMany({
      user: user._id
    }, {
      $set: {
        isRead: true
      }
    })
  } catch (error) {
    console.error('Couldn\'t set all notifications as read for user', user, error)

    throw new Error('Couldn\'t set notifications')
  }
}
