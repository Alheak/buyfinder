import { faArrowLeft, faArrowRight, faCheckCircle, faExternalLink } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useState } from "react"
import { shops } from "../../data/shopsClient"
import { useToast } from "../../store/ToastContext"
import Button from "../_utils/Button"
import LoadingSpinner from "../_utils/LoadingSpinner"
import Notice from "../_utils/Notice"
import Toggle from "../_utils/Toggle"

export default function WatchPointsShop () {
  const { data: session, update: updateSession } = useSession()
  const { updateToast } = useToast()
  const [checkoutWindow, setCheckoutWindow] = useState<Window | null>(null)
  const [currentStep, setCurrentStep] = useState<0|1>(0)
  const [selectedAmount, setSelectedAmount] = useState<null | 150000 | 300000 | 450000>(null)
  const [isRecurring, setIsRecurring] = useState<boolean>(false)
  const [hasAgreed, setHasAgreed] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isCancelled, setIsCancelled] = useState(false)

  async function createCheckoutSession () {
    if (!selectedAmount || isLoading) return

    if (!hasAgreed) {
      updateToast('You have to agree to the privacy policy and the terms of service in order to proceed.', 'error')

      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/stripe/createCheckoutSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'watchPoints',
          amount: selectedAmount,
          recurring: isRecurring
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
  }

  async function checkoutEnded () {
    const previousWatchPoints = session?.user.watchPoints || 0

    try {
      await updateSession()

      if ((session?.user.watchPoints || 0) > previousWatchPoints) {
        updateToast('The payment has been confirmed, thank you!', 'success')

        close()
      } else {
        setIsCancelled(true)
      }
    } catch (error) {
      updateToast('Something went wrong trying to verify the payment. Try refreshing the page.', 'error')

      setIsCancelled(true)
    } finally {
      setCheckoutWindow(null)
      setIsLoading(false)
    }
  }

  return (
    <div className="w-96 p-4">
      {
        isLoading ? (
          <div className="flex flex-col justify-center items-center w-full h-96 gap-8">
            <LoadingSpinner />
            <p className="text-center">
              Payment in progress, do not close this window.
              <br />
              If you do, refresh the website after the payment.
            </p>
          </div>
        ) : (
          isCancelled ? (
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
                currentStep === 0 && (
                  <>
                    <div className="mb-4">
                      <Notice>
                        <span>
                          Watch Points allow your watches to be automatically searched.
                        </span>
                        <br />
                        <a href="/faq#WatchPoints" target="_blank">
                          <span className="mr-2">
                            Learn more
                          </span>
                          <FontAwesomeIcon icon={faExternalLink} />
                        </a>
                      </Notice>
                    </div>
                    {
                      session?.user.watchPointsSubscription && (
                        <div className="flex flex-col items-center mb-4">
                          <p className="mb-4">
                            <FontAwesomeIcon icon={faCheckCircle} />
                            <span className="ml-2">
                              Currently subscribed to a monthly recharge.
                            </span>
                          </p>
                          <a
                            className="h-10 px-4 py-2 shadow-md rounded-md bg-sky-600 text-white transition-colors hover:no-underline hover:bg-slate-200 hover:text-black"
                            href={process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_LINK}
                            rel="nofollow noreferrer"
                            target="_blank"
                          >
                            <span className="mr-2">
                              Manage my subscription
                            </span>
                            <FontAwesomeIcon icon={faExternalLink} />
                          </a>
                          <hr className="w-full mt-4 border-zinc-400 dark:border-zinc-600" />
                        </div>
                      )
                    }
                    <h3 className="text-lg">
                      {
                        session?.user.watchPointsSubscription ? 'Buy more:' : 'Select the desired amount:'
                      }
                    </h3>
                    <div className="flex my-2 rounded-md shadow-md bg-zinc-100 dark:bg-zinc-700 divide-x divide-zinc-300 dark:divide-zinc-600 overflow-hidden">
                      <button
                        title="150000 Watch Points"
                        className={`grow py-2 ${selectedAmount === 150000 ? 'bg-sky-300 dark:bg-sky-500' : ''} hover:bg-slate-200 hover:dark:bg-slate-500 transition-all`}
                        onClick={() => setSelectedAmount(150000)}
                      >
                        <span>150000</span>
                        <br />
                        <span className="text-xs text-zinc-800 dark:text-zinc-200">5.99 USD</span>
                      </button>
                      <button
                        title="300000 Watch Points"
                        className={`grow py-2 ${selectedAmount === 300000 ? 'bg-sky-300 dark:bg-sky-600' : ''} hover:bg-slate-200 hover:dark:bg-slate-500 transition-all`}
                        onClick={() => setSelectedAmount(300000)}
                      >
                        <span>300000</span>
                        <br />
                        <span className="text-xs text-zinc-800 dark:text-zinc-200">9.99 USD</span>
                      </button>
                      <button
                        title="450000 Watch Points"
                        className={`grow py-2 ${selectedAmount === 450000 ? 'bg-sky-300 dark:bg-sky-600' : ''} hover:bg-slate-200 hover:dark:bg-slate-500 transition-all`}
                        onClick={() => setSelectedAmount(450000)}
                      >
                        <span>450000</span>
                        <br />
                        <span className="text-xs text-zinc-800 dark:text-zinc-200">13.99 USD</span>
                      </button>
                    </div>
                    <span className="text-xs italic text-zinc-800 dark:text-zinc-200">
                      1 Watch Point = 1 automatic search per shop. <br />
                      150000 Watch Points are equivalent to about one month of automatic searches every 10 minutes through all {Object.keys(shops).length} shops.
                    </span>
                    {
                      !session?.user.watchPointsSubscription && (
                        <>
                          <br /><br />
                          <Toggle
                            checked={isRecurring}
                            textSize="sm"
                            action={() => setIsRecurring(prev => !prev)}
                          >
                            Renew automatically every month
                          </Toggle>
                        </>
                      )
                    }
                    <br /><br />
                    <Button title={!!selectedAmount ? 'Go to payment' : 'An amount is required before proceeding'} className="w-full" action={() => setCurrentStep(1)} disabled={!selectedAmount}>
                      <span className="mr-2">Next</span>
                      <FontAwesomeIcon icon={faArrowRight} />
                    </Button>
                  </>
                )
              }
              {
                currentStep === 1 && (
                  <>
                    <Button action={() => setCurrentStep(0)}>
                      <FontAwesomeIcon icon={faArrowLeft} />
                      <span className="ml-2">Back</span>
                    </Button>
                    <h3 className="mt-4 text-lg">Review</h3>
                    <table className="w-full mt-2 mb-4 rounded-md shadow-md bg-zinc-100 dark:bg-zinc-700 divide-y divide-zinc-300 dark:divide-zinc-600">
                      <thead className="text-left">
                        <tr>
                          <th className="p-2">Amount</th>
                          <th className="p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2">{selectedAmount}</td>
                          <td className="p-2">{(selectedAmount || 0) / 150000 * 4 + 1.99} USD {isRecurring ? 'per month' : ''}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="mt-4">
                      <input type="checkbox" name="hasAgreed" id="PrivacyPolicy" checked={hasAgreed} onChange={() => setHasAgreed(prev => !prev)} />
                      <label htmlFor="hasAgreed" onClick={() => setHasAgreed(prev => !prev)}>
                        <span className="ml-2">I agree to the <Link href="/privacy" target="_blank">Privacy Policy</Link> and <Link href="/terms" target="_blank">Terms of Service</Link>.</span>
                      </label>
                    </div>
                    <Button
                      className="w-full mt-4"
                      isLoading={isLoading}
                      action={() => createCheckoutSession()}
                      disabled={!hasAgreed}
                    >
                      Proceed to payment
                    </Button>
                  </>
                )
              }
            </>
          )
        )
      }
    </div>
  )
}
