import { signOut } from "next-auth/react"
import Link from "next/link"

export default function ProfileDropdown ({ isShowing, close }: { isShowing: boolean, close: () => void }) {
  function signOutClickHandler () {
    signOut()
    close()
  }

  return (
    <div className={`${isShowing ? 'flex' : 'hidden'} absolute top-14 right-0 flex-col w-32 shadow-md text-left divide-y divide-zinc-200 dark:divide-zinc-700 bg-zinc-50 dark:bg-zinc-800 z-10`}>
      <Link
        href="/profile"
        className="p-2 hover:no-underline transition-colors text-zinc-800 dark:text-white hover:bg-slate-200 hover:dark:bg-gray-600"
        onClick={() => close()}
      >
        Profile
      </Link>
      <Link
        href="/profile/notifications"
        className="p-2 hover:no-underline transition-colors text-zinc-800 dark:text-white hover:bg-slate-200 hover:dark:bg-gray-600"
        onClick={() => close()}
      >
        Notifications
      </Link>
      <Link
        href="/profile/watches"
        className="p-2 hover:no-underline transition-colors text-zinc-800 dark:text-white hover:bg-slate-200 hover:dark:bg-gray-600"
        onClick={() => close()}
      >
        Watches
      </Link>
      <Link
        href="/profile/membership"
        className="p-2 hover:no-underline transition-colors text-zinc-800 dark:text-white hover:bg-slate-200 hover:dark:bg-gray-600"
        onClick={() => close()}
      >
        Subscriptions
      </Link>
      <a
        href="#"
        className="p-2 hover:no-underline transition-colors text-zinc-800 dark:text-white hover:bg-slate-200 hover:dark:bg-gray-600"
        onClick={() => signOutClickHandler()}
      >
        Sign out
      </a>
    </div>
  )
}
