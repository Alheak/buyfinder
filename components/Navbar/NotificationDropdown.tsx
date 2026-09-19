import { faTimesCircle } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useSession } from "next-auth/react"
import Link from "next/link"
import React, { useEffect, useState } from "react"
import ReactTimeAgo from "react-time-ago"
import { useToast } from "../../store/ToastContext"
import { Notification } from "../../types/Notification"
import LoadingSpinner from "../_utils/LoadingSpinner"

function NotificationContent ({ notification }: { notification: Notification }) {
  return (
    <>
      <span>
        {notification.message || 'No message'}
      </span>
      <br />
      <span className="text-xs text-zinc-700 dark:text-zinc-300">
        <ReactTimeAgo date={new Date(notification.createdAt)} locale="en-US" />
      </span>
    </>
  )
}

export default function NotificationDropdown ({ isShowing, close }: { isShowing: boolean, close: () => void }) {
  const { update } = useSession()
  const { updateToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [loadingNotifications, setLoadingNotifications] = useState<number[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])

  async function getNotifications () {
    try {
      const res = await fetch('/api/notifications?isRead=false')
      const notifications = await res.json() as Notification[]

      setNotifications(notifications)
    } catch (error) {
      updateToast('Couldn\'t fetch notifications.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  async function setNotificationRead (e: React.SyntheticEvent, index: number) {
    e.preventDefault()

    if (loadingNotifications.includes(index)) return

    const loadingNotification = notifications[index]

    setLoadingNotifications(prev => [...prev, index])

    try {
      const res = await fetch('/api/notifications/setRead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: loadingNotification._id
        })
      })
      
      if (res.ok) {
        setNotifications(prev => [...prev.filter(notification => loadingNotification._id.toString() !== notification._id.toString())])
      }
    } catch (error) {
      updateToast('Couldn\'t set notification as read.', 'error')
    }

    setLoadingNotifications(prev => [...prev.filter(notification => notification !== index)])
  }

  async function setAllNotificationsRead (e: React.SyntheticEvent) {
    e.preventDefault()

    if (isLoading) return

    setIsLoading(true)

    try {
      const res = await fetch('/api/notifications/setAllRead', {
        method: 'POST'
      })
      
      if (res.ok) {
        setNotifications([])
      }
    } catch (error) {
      updateToast('Couldn\'t set notification as read.', 'error')
    }

    setIsLoading(false)
  }

  useEffect(() => { if (isShowing) getNotifications() }, [isShowing])

  useEffect(() => { update() }, [notifications.length])

  return (
    <div className={`${isShowing ? 'flex' : 'hidden'} absolute top-14 right-0 flex-col min-w-[8rem] w-max max-w-md shadow-md text-left divide-y divide-zinc-200 dark:divide-zinc-700 bg-white dark:bg-zinc-700 z-10`}>
      {
        isLoading ? (
          <div className="flex h-32 justify-center items-center p-2">
            <LoadingSpinner />
          </div>
        ) : (
          !!notifications.length ? (
            <div className="flex flex-col text-sm">
              <p className="p-2 text-right bg-stone-100 dark:bg-stone-800">
                <a
                  href="#"
                  onClick={(e) => setAllNotificationsRead(e)}
                >
                  Set all as read
                </a>
              </p>
              <div className="flex flex-col max-h-[50vh] overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-700">
                {
                  notifications.map((notification, index) => (
                    loadingNotifications.includes(index) ? (
                      <div key={notification._id.toString()} className="flex justify-center items-center p-2">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      <div key={notification._id.toString()} className="flex items-center p-2 gap-2 hover:bg-zinc-100 hover:dark:bg-zinc-600">
                        {
                          notification.route ? (
                            <Link className="text-black dark:text-white hover:no-underline" href={notification.route || ''}>
                              <NotificationContent notification={notification} />
                            </Link>
                          ) : (
                            <p>
                              <NotificationContent notification={notification} />
                            </p>
                          )
                        }
                        <a
                          title="Set the notification as read"
                          href="#"
                          className="text-zinc-500 dark:text-white"
                          onClick={(e) => setNotificationRead(e, index)}
                        >
                          <FontAwesomeIcon icon={faTimesCircle} />
                        </a>
                      </div>
                    )
                  ))
                }
              </div>
            </div>
          ) : (
            <div className="p-4 text-center bg-zinc-50 dark:bg-zinc-800">
              <p className="text-zinc-400 dark:text-zinc-400">You don&apos;t have any unread notifications</p>
            </div>
          )
        )
      }
      <Link href="/profile/notifications" className="p-2 text-center text-black dark:text-white bg-stone-100 dark:bg-stone-800" onClick={() => close()}>
        See all notifications
      </Link>
    </div>
  )
}
