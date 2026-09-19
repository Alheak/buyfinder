import Link from "next/link"

export default function AboutDropdown ({ isShowing }: { isShowing: boolean }) {
  return (
    <div className={`${isShowing ? 'flex' : 'hidden'} absolute top-14 right-0 flex-col w-32 shadow-md text-left divide-y divide-zinc-200 dark:divide-zinc-700 bg-zinc-50 dark:bg-zinc-800 z-10`}>
      <Link href="/about" className="p-2 hover:no-underline transition-colors text-zinc-800 dark:text-white hover:bg-slate-200 hover:dark:bg-gray-600">About</Link>
      <Link href="/faq" className="p-2 hover:no-underline transition-colors text-zinc-800 dark:text-white hover:bg-slate-200 hover:dark:bg-gray-600">FAQ</Link>
    </div>
  )
}
