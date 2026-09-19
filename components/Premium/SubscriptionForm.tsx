import { useState } from "react"
import Button from "../_utils/Button"
import { useToast } from "../../store/ToastContext"
import LoadingSpinner from "../_utils/LoadingSpinner"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowRight, faCheckCircle, faExternalLink } from "@fortawesome/free-solid-svg-icons"
import H3 from "../_utils/H3"
import Tag from "../_utils/Tag"

export default function SubscriptionForm ({ close }: { close: () => void }) {
  const { updateToast } = useToast()
  const { data: session, update: updateSession } = useSession()
  const [checkoutWindow, setCheckoutWindow] = useState<Window | null>(null)
  const isUpgrading = session?.user.hasActiveSubscription && session?.user.subscriptionLevel === 1
  const [subscriptionLevel, setSubscriptionLevel] = useState<null | 1 | 2>(null)
  const [hasAgreed, setHasAgreed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)

  async function createCheckoutSession () {
    if (!subscriptionLevel || checkoutWindow || isLoading) return

    if (!hasAgreed) {
      updateToast('You have to agree to the privacy policy and the terms of service in order to subscribe.', 'error')

      return
    }

    setIsLoading(true)

    if (!session?.user.hasActiveSubscription) {
      try {
        const res = await fetch('/api/stripe/createCheckoutSession', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'subscription',
            subscriptionLevel
          })
        })
        const url = await res.text()
        const newCheckoutWindow = open(url, 'checkoutWindow', 'popup')

        setCheckoutWindow(newCheckoutWindow)

        const windowIsClosedChecker = setInterval(() => {
          if (!!windowIsClosedChecker && newCheckoutWindow && newCheckoutWindow.closed) {
            clearInterval(windowIsClosedChecker)
            checkoutEnded()
          }
        }, 1000)
      } catch (error) {
        updateToast('Something went wrong trying to checkout', 'error')
      }
    } else {
      try {
        const res = await fetch('/api/subscriptions/upgrade')

        if (!res.ok) throw new Error('Error trying to upgrade the subscription')

        checkoutEnded()
      } catch (error) {
        updateToast('Something went wrong trying to upgrade the subscription. Retry or contact the admin.', 'error')
      }
    }
  }

  async function checkoutEnded () {
    try {
      const res = await fetch('/api/subscriptions/status')
      const status = await res.json()

      await updateSession()

      if (status.hasActiveSubscription) {
        updateToast('You are now subscribed, thank you!', 'success')

        close()
      } else {
        setIsCancelled(true)
      }
    } catch (error) {
      updateToast('Something went wrong trying to verify the subscription status. Try refreshing the page.', 'error')

      setIsCancelled(true)
    } finally {
      setCheckoutWindow(null)
      setIsLoading(false)
    }
  }

  const CheckoutSummary = () => {
    switch (subscriptionLevel) {
      case 1:
        return (
          <tr>
            <td className="mr-2 py-2 border-b border-zinc-500">
              Premium subscription
            </td>
            <td className="py-2 border-b border-zinc-500">
              2 USD / month
            </td>
          </tr>
        )

      default:
        return (
          <tr>
            <td className="mr-2 py-2 border-b border-zinc-500">
              Premium subscription
            </td>
            <td className="py-2 border-b border-zinc-500">
              <span>
                5 USD / month
              </span>
              {
                isUpgrading && (
                  <span>
                    *
                  </span>
                )
              }
            </td>
          </tr>
        )
    }
  }

  return (
    <div className="w-96 p-4">
      {
        (!!session?.user.hasActiveSubscription) ? (
          <div className="flex flex-col items-center">
            <p className="mb-4">
              <FontAwesomeIcon icon={faCheckCircle} />
              <span className="ml-2">
                Currently subscribed to Premium.
              </span>
            </p>
            <a
              className="h-10 px-4 py-2 shadow-md rounded-md bg-sky-600 text-white transition-colors hover:no-underline hover:bg-slate-200 hover:text-black"
              href="https://billing.stripe.com/p/login/4gwg2R08I5RrcMgfYY"
              rel="nofollow noreferrer"
              target="_blank"
            >
              <span className="mr-2">
                Manage my subscription
              </span>
              <FontAwesomeIcon icon={faExternalLink} />
            </a>
          </div>
        ) : (
          isLoading ? (
            <div className="flex flex-col justify-center items-center w-full h-96 gap-8">
              <LoadingSpinner />
              <p className="text-center">
                Payment in progress, do not close this window.
                <br />
                If you do, refresh the website after the payment to benefit from Premium.
              </p>
            </div>
          ) : (isCancelled ? (
              <>
                <p>
                  The payment has been cancelled.
                </p>
                <div className="flex items-start mt-4">
                  <Button type="button" action={() => createCheckoutSession()}>
                    <span>
                      Try again
                    </span>
                  </Button>
                </div>
              </>
            ) : (
              <>
                {
                  !subscriptionLevel ? (
                    <>
                      <p>
                        By subscribing to Premium, you help keep the website running and get access to the following features:
                      </p>
                      <ul className="my-2 ml-6 list-outside list-square">
                        <li>Price charts</li>
                        <li>Simultaneous searches on the website</li>
                      </ul>
                      <Link href="/faq#Premium" target="_blank">
                        Learn more <FontAwesomeIcon icon={faExternalLink} />
                      </Link>
                      <table className="w-full table-auto mt-8">
                        <thead>
                          <tr>
                            <th className="pb-4 border-b border-zinc-500">
                              <span className="mr-2">
                                Premium
                              </span>
                              <Tag text="2 USD per month" />
                            </th>
                            {/* <th className="py-2 border-b border-zinc-500">
                              <span className="mr-2">
                                Premium
                              </span>
                              <Tag text="$5/mo" />
                            </th> */}
                          </tr>
                        </thead>
                        {/* <tbody>
                          <tr>
                            <td className="w-1/2 mr-2 py-2 border-b border-zinc-500 align-top">
                              <ul className="ml-6 list-outside list-square">
                                <li>
                                  Price charts
                                </li>
                              </ul>
                            </td>
                            <td className="w-1/2 py-2 border-b border-zinc-500 align-top">
                              <ul className="ml-6 list-outside list-square">
                                <li>Price charts</li>
                                <li>Automatic watch searches</li>
                                <li>Watch search customization</li>
                                <li>Access to future Premium features</li>
                              </ul>
                            </td>
                          </tr>
                        </tbody> */}
                        <tfoot>
                          <tr>
                            <td className="mr-2 pt-4">
                              <div className="flex justify-center items-center w-full">
                                <Button isFullWidth action={() => setSubscriptionLevel(1)}>
                                  Next <FontAwesomeIcon icon={faArrowRight} />
                                </Button>
                              </div>
                            </td>
                            {/* <td className="py-2">
                              <div className="flex justify-center items-center w-full">
                                <Button action={() => setSubscriptionLevel(2)}>
                                  Choose
                                </Button>
                              </div>
                            </td> */}
                          </tr>
                        </tfoot>
                      </table>
                    </>
                  ) : (
                    <>
                      <H3>
                        Order summary
                      </H3>
                      <table className="w-full table-auto text-left">
                        <thead>
                          <tr>
                            <th className="py-2 border-b border-zinc-500">
                              Item
                            </th>
                            <th className="py-2 border-b border-zinc-500">
                              Price
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="mr-2 py-2 border-b border-zinc-500">
                              Premium subscription
                            </td>
                            <td className="py-2 border-b border-zinc-500">
                              2 USD / month
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      {
                        isUpgrading && (
                          <span className="text-sm italic">
                            * What you already paid and the time already used this month for your current plan will be deducted from the first payment
                          </span>
                        )
                      }
                      {/* {
                        !session?.user.hasActiveSubscription && (
                          <p className="mt-2 text-sm text-right">
                            <a href="#" onClick={() => setSubscriptionLevel(null)}>
                              <FontAwesomeIcon icon={faRightLeft} />
                              <span className="ml-2">Choose another plan</span>
                            </a>
                          </p>
                        )
                      } */}
                      <div className="mt-4">
                        <input type="checkbox" name="hasAgreed" id="PrivacyPolicy" checked={hasAgreed} onChange={() => setHasAgreed(prev => !prev)} />
                        <label htmlFor="hasAgreed" onClick={() => setHasAgreed(prev => !prev)}>
                          <span className="ml-2">I agree to the <Link href="/privacy" target="_blank">Privacy Policy</Link> and <Link href="/terms" target="_blank">Terms of Service</Link>.</span>
                        </label>
                      </div>
                      <div className="flex items-start mt-4">
                        <Button
                          className="w-full"
                          type="button"
                          isLoading={isLoading}
                          action={() => createCheckoutSession()}
                          disabled={!hasAgreed}
                        >
                          Subscribe
                        </Button>
                      </div>
                      <small className="italic">
                        You can cancel the subscription whenever you want
                      </small>
                    </>
                  )
                }
              </>
            )
          )
        )
      }
    </div>
  )
}
