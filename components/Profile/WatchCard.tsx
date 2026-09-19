import Image from 'next/image'
import TimeAgo from 'javascript-time-ago'
import { faCheckCircle, faChevronDown, faChevronUp, faCog, faTrash } from '@fortawesome/free-solid-svg-icons'
import { Watch, WatchData } from '../../types/Watch'
import { useEffect, useMemo, useState } from 'react'
import Modal from '../_utils/Modal'
import Button from '../_utils/Button'
import { useToast } from '../../store/ToastContext'
import WatchForm from '../Figure/WatchForm'
import Link from 'next/link'
import { Listing } from '../../types/Listing'
import { shops } from '../../data/shopsClient'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import FigureListing from '../Figure/FigureListing'
import ReportForm from '../Figure/ReportForm'
import { imageSrcRegex } from '../../mixins/imageSrcRegex'
import FigurePriceData from '../Figure/FigurePriceData'
import { useNsfw } from '../../store/NsfwContext'
import Tooltip from '../_utils/Tooltip'
import en from 'javascript-time-ago/locale/en'
import ReactTimeAgo from 'react-time-ago'

TimeAgo.addDefaultLocale(en)

const timeAgo = new TimeAgo('en-US')

export default function WatchCard ({ watch, onEdit, onDelete, controls = true }: { watch: Watch, onEdit?: (watch: Watch) => void, onDelete?: () => void, controls?: boolean }) {
  const { allowNsfw } = useNsfw()
  const { updateToast } = useToast()
  const [showAllListings, setShowAllListings] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalElement, setModalElement] = useState<'edit' | 'delete' | null>(null)
  const watchData: WatchData = {
    figureId: watch.figure._id.toString(),
    shopsToSearch: watch.shopsToSearch,
    shopRules: watch.shopRules,
    maximumPrice: watch.maximumPrice,
    currency: watch.currency,
    activeSearch: watch.activeSearch,
    frequency: watch.frequency
  }
  const [flaggedListingIndex, setFlaggedListingIndex] = useState<number | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const imageIsNsfw = /\[NSFW/.test(watch.figure.name)
  const src = watch.figure && watch.figure.image && imageSrcRegex.test(watch.figure.image) && (!imageIsNsfw || (imageIsNsfw && allowNsfw)) ? watch.figure.image : '/404.jpg'
  const shopsToSearch = watch.shopsToSearch?.filter(shop => !!shops[shop])
  const newListings = watch.newListings ? watch.newListings.filter(listing => !!shops[listing.shop]) : []
  const flaggedListing = flaggedListingIndex !== null ? newListings[flaggedListingIndex] : undefined

  function editWatch (watch: Watch) {
    setModalElement(null)

    if (!!onEdit) onEdit(watch)
  }

  useEffect(() => {
    setShowReportModal(!!flaggedListingIndex)
  }, [flaggedListingIndex])

  useEffect(() => {
    if (!showReportModal) setFlaggedListingIndex(null)
  }, [showReportModal])

  async function deleteWatch () {
    setModalElement(null)

    try {
      const res = await fetch(`/api/watches/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          figureId: watch.figure._id.toString()
        })
      })
      const data = await res.json()

      if (data === null && !!onDelete) onDelete()
    } catch (error) {
      updateToast('Something went wrong trying to delete the watch.', 'error')
    }
  }

  function toggleShowAllListings (e: React.SyntheticEvent) {
    e.preventDefault()

    setShowAllListings(prev => !prev)
  }

  function report (e: React.SyntheticEvent, index: number) {
    e.preventDefault()
  
    setFlaggedListingIndex(index)
  }

  async function removeListing (e: React.SyntheticEvent, index: number) {
    e.preventDefault()

    if (
      !!newListings &&
      !!newListings.length &&
      window.confirm('Are you sure you want to remove this listing?')
    ) {
      const listing = newListings[index]
  
      try {
        const res = await fetch('/api/listings/setValidity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            _id: listing._id.toString(),
            isWrong: true
          })
        })
        
        if (res.ok && !!onEdit) {
          watch.newListings = [...(watch.newListings || [])].filter((newListing, i) => i !== index)

          onEdit(watch)
        }
      } catch (error) {
        updateToast(`Listing couldn't be removed.`, 'error')
      }
    }
  }

  useEffect(() => {
    setShowModal(!!modalElement)
  }, [modalElement])

  return (
    <div className="flex w-full h-min justify-between">
      <div className="flex w-full">
        <div className="flex flex-col justify-between items-start w-full h-full rounded-md shadow-md text-black dark:text-white bg-zinc-50/75 dark:bg-zinc-800">
          <Link
            href={`/figure/${watch.figure.slug || watch.figure._id.toString()}`}
            className="flex w-full h-full rounded-md shadow-md hover:no-underline transition-colors text-black dark:text-white bg-white dark:bg-zinc-800 hover:bg-slate-200 hover:dark:bg-gray-600"
          >
            <figure className="w-24 h-full">
              <Image
                src={src}
                width={150}
                height={150}
                className="w-full h-full object-cover rounded-md"
                alt="Picture of the figure"
                priority
              />
            </figure>
            <div className="relative flex flex-col justify-between items-start w-full h-full px-3 py-2">
              <div className="flex flex-col w-full">
                <h3 title={watch.figure?.name || watch.figure._id.toString()} className="w-full mb-1 font-bold line-clamp-2">{watch.figure?.name || watch.figure._id.toString()}</h3>
                {
                  controls && (
                    <>
                      {
                        !!watch.maximumPrice && (
                          <p className="text-sm">
                            <strong>Maximum price set:</strong> <span>{watch.maximumPrice}</span> <span>{watch.currency}</span>
                          </p>
                        )
                      }
                      {
                        !!shopsToSearch?.length && (
                          <div className="text-sm flex gap-1">
                            <strong>Searching on: </strong>
                            <div className="grow inline flex gap-1">
                              {shopsToSearch.slice(0, 2).map(shop => shops[shop].name).join(', ')}
                              {
                                shopsToSearch.length > 2 && (
                                  <>
                                    <span> and </span>
                                    {
                                      shopsToSearch.length === 3 ? (
                                        <span>{shops[shopsToSearch[2]].name}</span>
                                      ) : (
                                        <div className="grow relative">
                                          <Tooltip info={shopsToSearch.slice(2).map(shop => shops[shop].name).join(', ')}>{shopsToSearch.length - 2} others</Tooltip>
                                        </div>
                                      )
                                    }
                                  </>
                                )
                              }
                            </div>
                          </div>
                        )
                      }
                      {
                        !!watch.activeSearch && (
                          <div className="relative w-max mt-2 mb-8 px-2 py-1 rounded-md text-sm text-white bg-gradient-to-br from-green-600 to-emerald-600">
                            <Tooltip info={watch.lastCheck ? `Last checked ${timeAgo.format(new Date(watch.lastCheck))}` : 'Not checked yet'} fullWidth>
                              <FontAwesomeIcon icon={faCheckCircle} />
                              <span className="ml-2">Active search</span>
                            </Tooltip>
                          </div>
                        )
                      }
                    </>
                  )
                }
                <FigurePriceData figure={watch.figure} />
              </div>
            </div>
          </Link>
          {
            !!newListings && (
              <div className="flex flex-col w-full divide-y divide-zinc-400 dark:divide-zinc-700">
                <div className="mx-2 my-1">
                  {
                    newListings.length ? (
                      <p className="flex justify-start items-center">
                        <span className="px-2 py-1 text-lg text-zinc-800 dark:text-zinc-200">
                          Last found listings
                        </span>
                        {
                          !!watch.lastFound && (
                            <span className="px-2 py-1 text-md text-zinc-600 dark:text-zinc-400">
                              <ReactTimeAgo date={new Date(watch.lastFound)} locale="en-US" />
                            </span>
                          )
                        }
                      </p>
                    ) : (
                      <span className="block justify-between px-2 py-1 italic text-center text-lg text-zinc-600 dark:text-zinc-400 rounded-md">
                        No listings found
                      </span>
                    )
                  }
                </div>
                {
                  newListings.map((listing: Listing, index) => (
                    <FigureListing
                      key={listing._id.toString()}
                      listing={listing}
                      displayTag
                      displayShop
                      isHidden={index >= 2 && !showAllListings}
                      remove={(e) => removeListing(e, index)}
                      report={(e) => report(e, index)}
                    />
                  ))
                }
                {
                  newListings.length > 2 && (
                    <div className="mb-2">
                      <p
                        className="block justify-between mx-2 mt-2 px-2 py-1 text-center text-slate-800 dark:text-slate-200 rounded-md hover:no-underline transition-colors hover:bg-gray-300 hover:dark:bg-gray-600 cursor-pointer"
                        onClick={(e) => toggleShowAllListings(e)}
                      >
                        <small className="mr-4 text-sm">
                          {showAllListings ? 'Hide listings' : 'Show more listings'}
                        </small>
                        <FontAwesomeIcon icon={showAllListings ? faChevronUp : faChevronDown} />
                      </p>
                    </div>
                  )
                }
              </div>
            )
          }
        </div>
      </div>
      {
        controls && (
          <div className="flex flex-col gap-2 ml-2">
            {
              !!onEdit && (
                <Button title="Edit this watch" icon={faCog} bgColor="bg-white" textColor="text-black" action={() => setModalElement('edit')} isFullWidth />
              )
            }
            {
              !!onDelete && (
                <Button title="Delete this watch" icon={faTrash} bgColor="bg-red-600" action={() => setModalElement('delete')} isFullWidth />
              )
            }
          </div>
        )
      }
      {
        showReportModal && (
          <Modal title="Report a wrong result" onClose={() => setShowReportModal(false)}>
            <ReportForm
              shop={flaggedListing?.shop || ''}
              type={!!flaggedListing ? 'falsePositive' : 'falseNegative'}
              listing={flaggedListing}
              figureId={watch.figure._id.toString()}
              close={() => setShowReportModal(false)}
            />
          </Modal>
        )
      }
      {
        showModal && (
          <Modal title={modalElement === 'edit' ? 'Modify the watch' : 'Confirm'} onClose={() => setModalElement(null)}>
            {
              modalElement === 'edit' ? (
                <WatchForm watchData={watchData} onSubmit={(watch) => editWatch(watch)} />
              ) : (
                <div className="p-4">
                  <p>Are you sure you want to delete this watch?</p>
                  <div className="flex items-start mt-4">
                    <Button className="mr-2" bgColor="bg-red-600" textColor="text-white" action={() => deleteWatch()}>Delete</Button>
                    <Button bgColor="bg-white" textColor="text-black" action={() => setModalElement(null)}>Cancel</Button>
                  </div>
                </div>
              )
            }
          </Modal>
        )
      }
    </div>
  )
}