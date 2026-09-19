import TimeAgo from 'javascript-time-ago'
import { faBellSlash } from '@fortawesome/free-solid-svg-icons'
import { Notification } from '../../types/Notification'
import { useToast } from '../../store/ToastContext'
import en from 'javascript-time-ago/locale/en'
import ReactTimeAgo from 'react-time-ago'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import LoadingSpinner from '../_utils/LoadingSpinner'

TimeAgo.addDefaultLocale(en)

const timeAgo = new TimeAgo('en-US')

export default function NotificationCard ({ notification, controls = true, onSetRead }: { notification: Notification, controls?: boolean, onSetRead: () => void }) {
  const { updateToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  async function setRead (e: React.SyntheticEvent) {
    e.preventDefault()

    if (isLoading) return

    setIsLoading(true)

    try {
      const res = await fetch(`/api/notifications/setRead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: notification._id
        })
      })

      if (res.ok) {
        onSetRead()
      } else {
        throw new Error('Cannot set as read.')
      }
    } catch (error) {
      updateToast('Something went wrong trying to set the notification as read.', 'error')
    }

    setIsLoading(false)
  }

  return (
    <div className="flex w-full h-min justify-between">
      <div className="flex w-full">
        <div className="flex flex-col justify-between items-start w-full h-full rounded-md shadow-md text-black dark:text-white bg-zinc-50/75 dark:bg-zinc-800">
          <div className="flex w-full h-full rounded-md shadow-md hover:no-underline transition-colors text-black dark:text-white bg-white dark:bg-zinc-800 hover:bg-slate-200 hover:dark:bg-gray-600">
            <div className="relative flex flex-col justify-between items-start w-full h-full px-3 py-2">
              <div className={`flex flex-col ${notification.isRead ? 'text-zinc-600 dark:text-zinc-400' : ''}`}>
                <p>
                  { notification.message || 'No message' }
                </p>
                <p className="mt-2">
                  <strong>
                    <ReactTimeAgo date={new Date(notification.createdAt)} locale="en-US" />
                  </strong>
                </p>
              </div>
            </div>
            {
              (controls && !notification.isRead) && (
                <div className="flex flex-col gap-2 m-2">
                  {
                    isLoading ? (
                      <LoadingSpinner />
                    ) : (
                      <a href="#" title="Set this notification as read" className="text-black dark:text-white no-underline" onClick={(e) => setRead(e)}>
                        <FontAwesomeIcon icon={faBellSlash} />
                      </a>
                    )
                  }
                </div>
              )
            }
          </div>
        </div>
      </div>
    </div>
  )
}