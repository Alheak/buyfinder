import Link from "next/link"
import Navbar from "../Navbar"
import Toast from "./Toast"
import { useClick } from "../../store/ClickContext"
import Modal from "../_utils/Modal"
import SubscriptionForm from "../Premium/SubscriptionForm"
import { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTimesCircle, faWarning } from "@fortawesome/free-solid-svg-icons"

export default function Layout ({ children }: { children: React.ReactNode }) {
  const { updateClickTarget } = useClick()
  const [isNoticeClosed, setIsNoticeClosed] = useState(true)
  const [isReportsNoticeClosed, setIsReportsNoticeClosed] = useState(true)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  function closeNotice (e: React.SyntheticEvent) {
    e.preventDefault()

    setIsNoticeClosed(true)

    localStorage.setItem('isNoticeClosedJanFeb2025', 'true')
  }

  function closeReportsNotice (e: React.SyntheticEvent) {
    e.preventDefault()

    setIsReportsNoticeClosed(true)

    localStorage.setItem('isReportsNoticeClosed', 'true')
  }

  useEffect(() => {
    if (!localStorage.getItem('isNoticeClosedJanFeb2025')) setIsNoticeClosed(false)
    if (!localStorage.getItem('isReportsNoticeClosed')) setIsReportsNoticeClosed(false)
  }, [])

  return (
    <div className="relative flex flex-col min-h-s-screen h-full bg-zinc-100 dark:bg-zinc-900" onClick={updateClickTarget}>
      <Navbar />
      {/* {
        !isNoticeClosed && (
          <div className="px-2 mt-14 -mb-14 shadow-md text-white bg-yellow-800">
            <p className="container flex items-center gap-4 mx-auto p-2">
              <FontAwesomeIcon icon={faWarning} />
              <span className="grow text-sm">
                I&apos;ll be away from Jan 23rd to Feb 23rd. If the server experiences issues that can&apos;t be resolved remotely, the website might become unavailable until I get back. <br />
                If the website was to become unavailable for an extended amount of time and you are a Premium subscriber, you&apos;ll be able to ask for a refund.
              </span>
              <a href="#" className="text-white" title="Close the notice" onClick={(e) => closeNotice(e)}>
                <FontAwesomeIcon icon={faTimesCircle} />
              </a>
            </p>
          </div>
        )
      } */}
      {/* {
        !isReportsNoticeClosed && (
          <div className="px-2 mt-14 -mb-14 shadow-md text-white bg-yellow-800">
            <p className="container flex items-center gap-4 mx-auto p-2">
              <FontAwesomeIcon icon={faWarning} />
              <span className="grow text-sm">
                Unfortunately, wrong results for items that don&apos;t have a known JAN can no longer be reported until at least Feb 23rd.
              </span>
              <a href="#" className="text-white" title="Close the notice" onClick={(e) => closeReportsNotice(e)}>
                <FontAwesomeIcon icon={faTimesCircle} />
              </a>
            </p>
          </div>
        )
      } */}
      <main className="flex-grow flex flex-col min-h-[calc(100vh-6.5rem)] min-h-[calc(100svh-6.5rem)] h-full mt-14">
        {children}
      </main>
      <p className="sticky bottom-0 self-end w-full sm:w-fit sm:mr-4 px-2 py-1 rounded-t-md shadow-md font-bold text-black bg-[#FEF5B8]">
        Support us by <a className="text-sky-600" href="https://ko-fi.com/alheak" target="_blank" rel="nofollow noreferrer">donating</a> or <a className="text-sky-600" href="#" onClick={() => setShowSubscriptionModal(true)}>subscribing to Premium</a>!
      </p>
      <footer className="w-full h-max shadow-md text-sm md:text-md bg-white dark:bg-zinc-800 z-10">
        <div className="container flex flex-col md:flex-row justify-center items-center h-full m-auto divide-y md:divide-y-0 md:divide-x divide-zinc-400 dark:divide-zinc-600">
          <div className="flex mb-2 pt-2 md:mt-2 md:pt-0 md:mr-4 md:pl-4 gap-1">
            <p>©&nbsp;buyfinder&#46;moe - </p><h2>Price comparator for anime figures</h2>
          </div>
          <ul className="flex items-center mb-2 pt-2 md:mt-2 md:pt-0 md:mr-4 md:pl-4 gap-4 text-center">
            <li>
              <Link href="/about">About</Link>
            </li>
            <li>
              <Link href="/terms">Terms of Use</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy Policy</Link>
            </li>
          </ul>
        </div>
      </footer>
      <Toast  />
      {
        showSubscriptionModal && (
          <Modal title="Premium subscription" onClose={() => setShowSubscriptionModal(false)}>
            <SubscriptionForm close={() => setShowSubscriptionModal(false)} />
          </Modal>
        )
      }
    </div>
  )
}
