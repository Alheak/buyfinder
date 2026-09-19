import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare, faFlag, faRefresh } from '@fortawesome/free-solid-svg-icons'
import type { Figure } from '../../types/Figure'
import PriceDisplay from '../../components/_utils/Price'
import { authOptions } from '../api/auth/[...nextauth]'
import Listings from '../../components/Figure/Listings'
import { Listing } from '../../types/Listing'
import PriceChart from '../../components/Figure/Chart'
import Button from '../../components/_utils/Button'
import Modal from '../../components/_utils/Modal'
import SubscriptionForm from '../../components/Premium/SubscriptionForm'
import SignIn from '../../components/Auth/SignIn'
import SignUp from '../../components/Auth/SignUp'
import { imageSrcRegex } from '../../mixins/imageSrcRegex'
import PriceChange from '../../components/Figure/PriceChange'
import Notice from '../../components/_utils/Notice'
import { useNsfw } from '../../store/NsfwContext'
import Link from 'next/link'
import LoadingSpinner from '../../components/_utils/LoadingSpinner'
import getExchangeRates from '../../api/utils/getExchangeRates'

type ListingsByShop = [string, Listing[], number]

export const getServerSideProps: GetServerSideProps = async ({ req, res, params }) => {
  try {
    const session = await getServerSession(req, res, authOptions)
    const figureRes = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/figures/figure?_id=${params?._id}&isSearch=true`, {
      headers: {
        'X-Session-Token': JSON.stringify(session)
      }
    })
    const figure = await figureRes.json() as Figure
    const cachedListingsRes = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/listings/cached?_id=${figure._id.toString()}`)
    const cachedSortedListingsByShops = await cachedListingsRes.json() as ListingsByShop[]
    const exchangeRates = await getExchangeRates()
  
    return {
      props: {
        figure,
        cachedSortedListingsByShops,
        exchangeRates
      }
    }
  } catch (error) {
    console.error(error)

    return {
      props: {},
      redirect: {
        destination: '/404'
      }
    }
  }
}

export default function Figure({ figure, cachedSortedListingsByShops, exchangeRates }: { figure: Figure, cachedSortedListingsByShops: ListingsByShop[], exchangeRates: { [key: string]: number } }) {
  const { allowNsfw } = useNsfw()
  const { data: session } = useSession()
  const router = useRouter()
  const [modalElement, setModalElement] = useState<'signin' | 'signup' | 'form' | null>(null)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [isReportsNoticeClosed, setIsReportsNoticeClosed] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const earliestRelease = figure?.releases.reverse().find(release => !!release.date)
  const jans = figure?.releases.map(release => release.jan).filter((jan, index, jans) => !!jan && jans.indexOf(jan) === index)
  const hasJan = !!figure.releases?.find(release => !!release.jan)
  const title = figure.name || (
    figure.releases.find(release => !!release.jan)?.jan ||
    `Item ID #${router.query._id}`
  )
  const imageIsNsfw = /\[NSFW/.test(figure.name)
  const src = figure && figure.image && imageSrcRegex.test(figure.image) && (!imageIsNsfw || (imageIsNsfw && allowNsfw)) ? figure.image : '/404.jpg'

  async function toggleWatch () {
    if (!session) {
      setModalElement('signin')

      return
    }

    if (!session.user.hasActiveSubscription) {
      setModalElement('form')

      return
    }

    setModalElement(null)
  }

  async function refreshFigureData () {
    if (isLoading) return

    setIsLoading(true)

    try {
      const res = await fetch(`/api/figures/refresh?_id=${figure._id.toString()}`)
      const data = await res.json()

      if (!res.ok || !data) throw new Error('Error trying to refresh figure data')

      router.replace(`/figure/${router.query._id}`)
    } catch (error) {
      console.error('Couldn\'t refresh figure data')
    }

    setIsLoading(false)
  }

  const ModalElement = () => {
    switch (modalElement) {
      case 'signin':
        return (
          <SignIn onSignIn={() => toggleWatch()} switchToSignUp={() => setModalElement('signup')} />
        )

      case 'signup':
        return (
          <SignUp onSignIn={() => toggleWatch()} switchToSignIn={() => setModalElement('signin')} />
        )

      case 'form':
        return (
          <SubscriptionForm close={() => setShowSubscriptionModal(false)} />
        )

      default:
        return (
          <div />
        )
    }
  }

  useEffect(() => setShowSubscriptionModal(!!modalElement), [modalElement])

  function closeReportsNotice () {
    setIsReportsNoticeClosed(true)

    localStorage.setItem('isReportsNoticeClosed', 'true')
  }

  useEffect(() => {
    if (!localStorage.getItem('isReportsNoticeClosed')) setIsReportsNoticeClosed(false)
  }, [])

  return (
    <>
      <Head>
        <meta name="image" property="og:image" content={src} />
        <meta name="title" property="og:title" content={title} />
        <title>{title}</title>
      </Head>

      <div className="container flex-grow flex flex-col mx-auto px-3 py-4">
        <section className="relative flex-grow flex flex-col md:flex-row">
          <h1 className="block md:hidden text-3xl mb-4">{title}</h1>
          <div className="flex flex-col w-full md:w-1/2 xl:w-full max-w-full md:max-w-md h-min mb-8 md:mb-0 rounded-md shadow-md bg-white dark:bg-zinc-800">
            <Image
              src={src}
              width={500}
              height={500}
              className="w-full h-min rounded-md shadow-md"
              alt="Picture of the figure"
              priority
            />
            <div className="flex flex-col px-2 text-sm">
              <div className="flex flex-col divide-y divide-zinc-300 dark:divide-zinc-600">
                {
                  (!!session && session.user.hasActiveSubscription) ? (
                    <PriceChart figure={figure} />
                  ) : (
                    <div className="flex justify-between items-center h-28 px-2 py-4 bg-chart">
                      <p className="mr-4 text-center [text-shadow:_0_0_0.5rem_#FFF] dark:[text-shadow:_0_0_0.5rem_#27272a]">Subscribe to Premium and get access to price charts and other features!</p>
                      <Button type="button" action={() => toggleWatch()}>
                        Subscribe
                      </Button>
                      {
                        showSubscriptionModal && (
                          <Modal title={modalElement === 'form' ? 'Premium subscription' : 'Sign in required'} onClose={() => setShowSubscriptionModal(false)}>
                            <ModalElement />
                          </Modal>
                        )
                      }
                    </div>
                  )
                }
                {
                  !!earliestRelease && (
                    <>
                      {
                        (earliestRelease.date) && (
                          <p className="flex md:flex-col lg:flex-row justify-between mb-2 pt-2">
                            <strong>
                              Earliest release date
                            </strong>
                            <span className="md:text-left lg:text-right">
                              {earliestRelease.date}
                            </span>
                          </p>
                        )
                      }
                      {
                        (earliestRelease.price && earliestRelease.currency) && (
                          <div className="flex md:flex-col lg:flex-row justify-between mb-2 pt-2">
                            <strong>
                              Original list price
                            </strong>
                            <p className="md:text-left lg:text-right">
                              <PriceDisplay price={earliestRelease.price} currencyFrom={earliestRelease.currency} />
                            </p>
                          </div>
                        )
                      }
                      {
                        !!figure?.priceData && (
                          <div className="relative flex md:flex-col lg:flex-row justify-between mb-2 pt-2">
                            <strong>
                              Current average price
                            </strong>
                            <div className="flex gap-2 md:text-left lg:text-right">
                              <PriceDisplay price={figure?.priceData.averagePrice} />
                              <PriceChange priceData={figure?.priceData} />
                            </div>
                          </div>
                        )
                      }
                      {
                        (!!jans && !!jans.length) && (
                          <div className="flex md:flex-col lg:flex-row justify-between mb-2 pt-2">
                            <strong>JAN</strong>
                            <p className="flex flex-col md:text-left lg:text-right">
                              {
                                jans.map(jan => (
                                  <span key={jan}>{jan}</span>
                                ))
                              }
                            </p>
                          </div>
                        )
                      }
                    </>
                  )
                }
                {
                  figure?.mfcLink && (
                    <p className="mb-2 pt-2">
                      <a href={figure.mfcLink} rel="nofollow noreferrer" target="_blank">
                        <span className="mr-2">See on MyFigureCollection</span>
                        <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                      </a>
                    </p>
                  )
                }
                {
                  !figure?.name && (
                    <p className="mb-2 pt-2 italic text-center text-zinc-400 dark:text-zinc-600">
                      Could not fetch figure data.
                    </p>
                  )
                }
              </div>
              {
                session?.user.admin && (
                  <Button className="mb-2" disabled={isLoading} action={() => refreshFigureData()} isFullWidth>
                    {
                      isLoading ? (
                        <LoadingSpinner />
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faRefresh} />
                          <span className="ml-2">Refresh figure data</span>
                        </>
                      )
                    }
                  </Button>
                )
              }
            </div>
          </div>
          <div className="w-full md:ml-4">
            {
              !isReportsNoticeClosed && (
                <>
                  <Notice type="info" fullWidth closable onClose={() => closeReportsNotice()}>
                    <p>
                      Help us by reporting wrong results <span className="mx-1 text-red-500"><FontAwesomeIcon icon={faFlag} /></span> and earn watch points!
                    </p>
                    <Link href="/faq#Reports" target="_blank">Learn more</Link>
                  </Notice>
                  <br />
                </>
              )
            }
            {
              !hasJan && (
                <>
                  <Notice type="info-light" fullWidth>
                    No JAN found for this item. Results may be inaccurate.
                  </Notice>
                  <br />
                </>
              )
            }
            <h1 className="hidden md:block text-3xl mb-4">{title}</h1>
            <Listings figure={figure} cachedSortedListingsByShops={cachedSortedListingsByShops} title={title} exchangeRates={exchangeRates} />
          </div>
        </section>
      </div>
    </>
  )
}
