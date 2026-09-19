import { GetServerSidePropsContext } from "next"
import { getServerSession } from "next-auth"
import Head from "next/head"
import { authOptions } from "../../api/auth/[...nextauth]"
import NotificationCard from "../../../components/Profile/NotificationCard"
import { useEffect, useState } from "react"
import Layout from "../../../components/Profile/layout"
import LoadingSpinner from "../../../components/_utils/LoadingSpinner"
import { Notification } from "../../../types/Notification"
import { useToast } from "../../../store/ToastContext"
import { useSession } from "next-auth/react"

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  try {
    const session = await getServerSession(context.req, context.res, authOptions)
  
    if (!session) {
      return {
        redirect: {
          destination: '/'
        }
      }
    }

    const res = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/notifications?limit=50`, {
      headers: {
        'X-Session-Token': JSON.stringify(session)
      }
    })
    const notifications = await res.json() as Notification[]
  
    return {
      props: {
        notifications
      }
    }
  } catch (error) {
    console.error(error)

    return {
      props: {
        notifications: []
      }
    }
  }
}

export default function Notifications ({ notifications }: { notifications: Notification[] }) {
  const { update } = useSession()
  const { updateToast } = useToast()
  const [shownNotifications, setShownNotifications] = useState(notifications)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true)
  const [docHeight, setDocHeight] = useState(typeof window === 'undefined' ? 0 : window.document.documentElement.scrollHeight)
  const [windowHeight, setWindowHeight] = useState(typeof window === 'undefined' ? 0 : window.innerHeight)
  const [scrolledPixels, setScrolledPixels] = useState(typeof window === 'undefined' ? 0 : window.scrollY)

  const pixelsLeftToScroll = docHeight - windowHeight - scrolledPixels
  const earliestNotification = shownNotifications.length ? shownNotifications[shownNotifications.length - 1] : null

  function updateNotification (index: number) {
    setShownNotifications(prev => [
      ...prev.slice(0, index),
      { ...prev[index], isRead: true },
      ...prev.slice(index + 1)
    ])

    update()
  }

  async function fetchMoreNotifications () {
    if (isLoading || !hasMoreNotifications) return

    setIsLoading(true)

    try {
      const res = await fetch(`/api/notifications/?from=${earliestNotification?._id.toString() || ''}&limit=50`)
      const newNotifications = await res.json() as Notification[]

      if (!newNotifications || !newNotifications.length) {
        setHasMoreNotifications(false)

        return
      }

      setShownNotifications(prev => [...prev, ...newNotifications])
      updateScroll()
    } catch (error) {
      console.error('Something went wrong trying to fetch notifications.')
    } finally {
      setIsLoading(false)
    }
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
        setShownNotifications(prev => prev.map(notification => {
          notification.isRead = true

          return notification
        }))

        update()
      }
    } catch (error) {
      updateToast('Couldn\'t set notification as read.', 'error')
    }

    setIsLoading(false)
  }

  useEffect(() => {
    if (!hasMoreNotifications) return

    if (pixelsLeftToScroll < 200) fetchMoreNotifications()
  }, [pixelsLeftToScroll])

  const updateScroll = () => {
    setDocHeight(window.document.documentElement.scrollHeight)
    setWindowHeight(window.innerHeight)
    setScrolledPixels(window.scrollY)
  }

  useEffect(() => {
    window.addEventListener('resize', updateScroll)
    window.addEventListener('scroll', updateScroll, { passive: true })

    return () => {
      window.removeEventListener('resize', updateScroll)
      window.removeEventListener('scroll', updateScroll)
    }
  }, [])

  return (
    <>
      <Head>
        <title>My Notifications - buyfinder</title>
      </Head>

      <Layout>
        <div className="flex items-center justify-between">
          <h1 className="mt-4 mb-8 text-4xl">
            My notifications
          </h1>
          {
            isLoading ? (
              <LoadingSpinner />
            ) : (
              <a href="#" onClick={(e) => setAllNotificationsRead(e)}>
                Set all as read
              </a>
            )
          }
        </div>
        <section className="flex flex-col gap-4">
          {
            shownNotifications && shownNotifications.length ? (
              shownNotifications.map((notification, index) => (
                <NotificationCard
                  key={notification._id.toString()}
                  notification={notification}
                  onSetRead={() => updateNotification(index)}
                />
              ))
            ) : (
              <div className="text-center text-xl text-zinc-500">
                No notifications
              </div>
            )
          }
          {
            isLoading && (
              <div className="flex justify-center items-center p-4 text-black dark:text-white">
                <LoadingSpinner />
                <span className="ml-2">Loading more notifications...</span>
              </div>
            )
          }
        </section>
      </Layout>
    </>
  )
}
