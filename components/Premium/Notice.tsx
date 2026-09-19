import Link from "next/link"
import { useState } from "react"
import Notice from "../_utils/Notice"
import Button from "../_utils/Button"
import Modal from "../_utils/Modal"
import SubscriptionForm from "./SubscriptionForm"
import { useSession } from "next-auth/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faExternalLink } from "@fortawesome/free-solid-svg-icons"

export default function PremiumNotice () {
  const { data: session, status } = useSession()
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  return (
    <Notice type="info-light">
      <>
        {
          !session?.user.hasActiveSubscription && (
            <p>
              With a Premium subscription, you get access to exclusive features like price charts and being able to search for multiple items at the same time.
            </p>
          )
        }
        <p className="flex justify-between items-center mt-2">
          <Link className="border-b-2 border-sky-600 text-sky-800 hover:no-underline" href="/faq#Premium" target="_blank">
            Learn more <FontAwesomeIcon icon={faExternalLink} />
          </Link>
          <Button type="button" action={() => setShowSubscriptionModal(true)}>
            Subscribe
          </Button>
        </p>
        {
          showSubscriptionModal && (
            <Modal title="Premium subscription" onClose={() => setShowSubscriptionModal(false)}>
              <SubscriptionForm close={() => setShowSubscriptionModal(false)} />
            </Modal>
          )
        }
      </>
    </Notice>
  )
}
