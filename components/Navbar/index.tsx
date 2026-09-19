import { useSession } from 'next-auth/react'
import { faBell, faCog, faMagnifyingGlass, faPlus, faQuestion, faSignIn, faUserCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import NavbarDropdown from './NavbarDropdown'
import Search from './Search'
import ProfileDropdown from './ProfileDropdown'
import LoadingSpinner from '../_utils/LoadingSpinner'
import Tooltip from '../_utils/Tooltip'
import NotificationDropdown from './NotificationDropdown'
import { useClick } from '../../store/ClickContext'
import Modal from '../_utils/Modal'
import WatchPointsShop from '../Figure/WatchPointsShop'

function UserComponent ({ isShowing, toggleDropdown }: { isShowing: boolean, toggleDropdown: () => void }) {
  const { data: session, status } = useSession()

  switch (status) {
    case 'loading':
      return (
        <LoadingSpinner />
      )

    case 'authenticated':
      return (
        <div className="relative h-full">
          <button
            title="Manage my account"
            className={`relative flex items-center justify-center h-full px-3 text-black dark:text-white transition-colors hover:bg-slate-200 hover:dark:bg-gray-600 ${isShowing ? 'shadow-md shadow-inner bg-zinc-50 dark:bg-zinc-800' : ''}`}
            onClick={toggleDropdown}
          >
            <FontAwesomeIcon icon={faUserCircle} />
          </button>
          <ProfileDropdown isShowing={isShowing} close={() => toggleDropdown()} />
        </div>
      )

    case 'unauthenticated':
      return (
        <Link
          title="Sign in"
          className="flex items-center justify-center h-full px-3 text-black dark:text-white transition-colors hover:bg-slate-200 hover:dark:bg-gray-600"
          href="/signin"
        >
          <FontAwesomeIcon icon={faSignIn} />
        </Link>
      )
  }
}

export default function Navbar () {
  const { data: session } = useSession()
  const { clickTarget } = useClick()
  const router = useRouter()
  const [currDropdown, setCurrDropdown] = useState<null | 'options' | 'profile' | 'search' | 'notification'>(null)
  const [watchPointsShopIsOpen, setWatchPointsShopIsOpen] = useState(false)

  const isHomePage = router.pathname === '/'

  function openWatchPointsShop (e: React.SyntheticEvent) {
    e.preventDefault()

    setWatchPointsShopIsOpen(true)
  }

  useEffect(() => {
    if (!clickTarget) return

    const id = 'Navbar'

    if (clickTarget.id === id) return

    let currElement: Element | HTMLElement = clickTarget

    while (currElement.parentElement) {
      if (currElement.parentElement.id === id) return

      currElement = currElement.parentElement
    }

    setCurrDropdown(null)
  }, [clickTarget])

  return (
    <nav id="Navbar" className="fixed w-full bg-white dark:bg-zinc-700 z-20">
      <div className="shadow-md">
        <div className="container flex justify-between items-center h-14 mx-auto px-0 md:px-3">
          <h1 className="h-full mr-2 text-xl">
            <Link
              title="Home page"
              className="flex items-center h-full pl-4 md:pl-0 hover:no-underline focus:no-underline active:no-underline"
              href="/"
            >
              <span className="text-black dark:text-white">
                buy<span className="font-bold">finder</span>
              </span>
            </Link>
          </h1>
          <Link
            className="relative flex items-center justify-center h-full px-3 text-sm text-black dark:text-white transition-colors hover:no-underline hover:bg-slate-200 hover:dark:bg-gray-600"
            href="/figures"
          >
            Browse
          </Link>
          {
            !isHomePage && (
              <>
                <button
                  title="Search"
                  className={`flex sm:hidden items-center justify-center h-full px-3 text-black dark:text-white transition-colors hover:bg-slate-200 hover:dark:bg-gray-600 ${currDropdown === 'search' ? 'shadow-md shadow-inner bg-zinc-50 dark:bg-zinc-800' : ''}`}
                  onClick={() => setCurrDropdown(prev => prev === 'search' ? null : 'search')}
                >
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </button>
                <div className={`${currDropdown === 'search' ? 'block' : 'hidden'} absolute sm:block top-14 right-0 left-0 sm:relative sm:top-auto sm:right-auto sm:left-auto w-full p-2 sm:py-0 bg-zinc-50 dark:bg-zinc-800 sm:bg-white sm:dark:bg-zinc-700`}>
                  <div className="max-w-lg m-auto">
                    <Search />
                  </div>
                </div>
              </>
            )
          }
          <div className="flex-grow" />
          <UserComponent isShowing={currDropdown === 'profile'} toggleDropdown={() => setCurrDropdown(prev => prev === 'profile' ? null : 'profile')} />
          {
            (!!session && !!session.user) && (
              <div className="relative flex items-center justify-center rounded-md text-xs text-black dark:text-white bg-zinc-100 dark:bg-zinc-800">
                <Tooltip info="Watch Points" fullWidth>
                  <span className="m-1">{session.user.watchPoints || 0}</span>
                </Tooltip>
                <button className="p-1 rounded-md transition-all text-white bg-sky-500 hover:bg-slate-400" title="Buy Watch Points" onClick={(e) => openWatchPointsShop(e)}>
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
            )
          }
          {
            watchPointsShopIsOpen && (
              <Modal title="Buy Watch Points" alignment="center" onClose={() => setWatchPointsShopIsOpen(false)}>
                <WatchPointsShop />
              </Modal>
            )
          }
          {
            (!!session && !!session.user) && (
              <div className="relative h-full">
                <button
                  title="Notifications"
                  className={`relative flex items-center justify-center h-full px-3 text-black dark:text-white transition-colors hover:bg-slate-200 hover:dark:bg-gray-600 ${currDropdown === 'notification' ? 'shadow-md shadow-inner bg-zinc-50 dark:bg-zinc-800' : ''}`}
                  onClick={() => setCurrDropdown(prev => prev === 'notification' ? null : 'notification')}
                >
                  {
                    !!session.user.notificationCount && (
                      <span className="absolute top-2 right-0 min-w-4 h-4 px-1 rounded-md text-xs text-white bg-red-500">
                        {session.user.notificationCount < 100 ? session.user.notificationCount : '99+'}
                      </span>
                    )
                  }
                  <FontAwesomeIcon icon={faBell} />
                </button>
                <NotificationDropdown isShowing={currDropdown === 'notification'} close={() => setCurrDropdown(null)} />
              </div>
            )
          }
          <Link
            className="relative flex items-center justify-center h-full px-3 text-black dark:text-white transition-colors hover:no-underline hover:bg-slate-200 hover:dark:bg-gray-600"
            href="/faq"
            title="FAQ"
          >
            <span className="hidden sm:inline text-sm">FAQ</span>
            <span className="inline sm:hidden"><FontAwesomeIcon icon={faQuestion} /></span>
          </Link>
          <button
            title="Settings"
            className={`flex items-center justify-center h-full px-3 text-black dark:text-white transition-colors hover:bg-slate-200 hover:dark:bg-gray-600 ${currDropdown === 'options' ? 'shadow-md shadow-inner bg-zinc-50 dark:bg-zinc-800' : ''}`}
            onClick={() => setCurrDropdown(prev => prev === 'options' ? null : 'options')}
          >
            <FontAwesomeIcon icon={faCog} />
          </button>
        </div>
      </div>
      <NavbarDropdown isShowing={currDropdown === 'options'} />
    </nav>
  )
}
