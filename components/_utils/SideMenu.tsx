import Link from "next/link"
import { useRouter } from "next/router"

interface Link {
  title: string
  path: string
}

export default function SideMenu ({ links, sticky }: { links: Link[], sticky?: boolean }) {
  const router = useRouter()
  const isActive = (path: string) => router.pathname === path

  return (
    <nav className={`${sticky ? 'sticky top-20' : ''} flex md:flex-col w-full md:w-48 h-min p-2 gap-2 shadow-md rounded-md bg-white dark:bg-zinc-700`}>
      {
        links.map(({ title, path }) => (
          <Link
            key={path}
            className={`px-2 py-1 rounded-md transition-colors text-black dark:text-white ${isActive(path) ? 'shadow-inner bg-zinc-50 dark:bg-zinc-800/25' : 'shadow-sm bg-zinc-50/25 dark:bg-zinc-600'} hover:no-underline hover:bg-slate-200 hover:dark:bg-gray-600`}
            href={path}
          >
            {title}
          </Link>
        ))
      }
    </nav>
  )
}
