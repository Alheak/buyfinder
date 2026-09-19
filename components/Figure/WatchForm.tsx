import { useRouter } from "next/router"
import React, { useMemo, useState } from "react"
import { Root, Track, Range, Thumb } from '@radix-ui/react-slider'
import cc from 'currency-codes'
import { useShops } from "../../store/ShopsContext"
import { shops } from "../../data/shopsClient"
import TextInput from "../_utils/TextInput"
import { useCurrency } from "../../store/CurrencyContext"
import Button from "../_utils/Button"
import { useToast } from "../../store/ToastContext"
import { Watch, WatchData, WatchOptions, frequencies } from "../../types/Watch"
import { useSession } from "next-auth/react"
import Toggle from "../_utils/Toggle"
import Tooltip from "../_utils/Tooltip"
import Notice from "../_utils/Notice"
import { faArrowLeft, faArrowRight, faBoxesStacked, faExternalLink, faQuestionCircle } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import WatchOptionsForm from "./WatchOptionsForm"
import Modal from "../_utils/Modal"
import WatchPointsShop from "./WatchPointsShop"

const ONE_MINUTE = 1000 * 60
const ONE_HOUR = 1000 * 60 * 60
const ONE_DAY = 1000 * 60 * 60 * 24

const watchOptionsTemplate: WatchOptions = {
  searches: [],
  mustContain: [],
  exclude: []
}

export default function WatchForm ({ watchData, onSubmit }: { watchData: WatchData, onSubmit: (watch: Watch) => void }) {
  const { data: session } = useSession()
  const router = useRouter()
  const { enabledShops } = useShops()
  const { currency } = useCurrency()
  const { updateToast } = useToast()
  const [shopsToSearch, setShopsToSearch] = useState((watchData.shopsToSearch || enabledShops).filter(shop => !!shops[shop]))
  const [isAddingWatchOptions, setIsAddingWatchOptions] = useState(false)
  const [shopFilter, setShopFilter] = useState('')
  const [shopRules, setShopRules] = useState<{ [key: string]: WatchOptions }>(watchData.shopRules || {})
  const [hasMaxPrice, setHasMaxPrice] = useState(!!watchData.maximumPrice)
  const [maximumPrice, setMaximumPrice] = useState(parseFloat(watchData.maximumPrice?.toFixed(2) || '0') || 0)
  const [selectedCurrency, setSelectedCurrency] = useState(currency.toUpperCase())
  const [activeSearch, setActiveSearch] = useState(!!watchData.activeSearch)
  const [isLoading, setIsLoading] = useState(false)
  const [watchPointsShopIsOpen, setWatchPointsShopIsOpen] = useState(false)
  const [frequencyIndex, setFrequencyIndex] = useState(watchData.frequency ? frequencies.indexOf(watchData.frequency) : 0)
  const frequency = frequencies[frequencyIndex]
  const hasEnoughWatchPoints = !!session?.user.watchPoints && session.user.watchPoints >= shopsToSearch.length
  const shopsForOptions = shopsToSearch.filter(shop => shops[shop].name.toLowerCase().includes(shopFilter.toLowerCase())).sort()

  function toggleShop (shop: string | null) {
    if (shop) {
      setShopsToSearch(prevShops => prevShops.includes(shop) ? prevShops.filter(prevShop => prevShop !== shop) : [...prevShops, shop])
    } else {
      setShopsToSearch(shopsToSearch.length === Object.keys(shops).length ? [] : Object.keys(shops))
    }
  }

  async function createWatch (e?: React.SyntheticEvent) {
    if (e) e.preventDefault()

    if (isLoading) return

    setIsLoading(true)

    try {
      const res = await fetch('/api/watches/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figureId: watchData.figureId,
          shopsToSearch,
          shopRules,
          maximumPrice: hasMaxPrice ? maximumPrice : null,
          currency,
          activeSearch,
          frequency
        })
      })
      const newWatch = await res.json() as Watch

      onSubmit(newWatch)
    } catch (error) {
      updateToast('Something went wrong trying to create the watch.', 'error')
    }

    setIsLoading(false)
  }

  function toggleWatchOptions (e: React.SyntheticEvent) {
    e.preventDefault()

    setIsAddingWatchOptions(prev => !prev)
  }

  function getReadableFrequency () {
    const minuteCount = frequency / ONE_MINUTE

    if (minuteCount < 60) return `${minuteCount > 1 ? minuteCount + ' ' : ''}minute${minuteCount > 1 ? 's' : ''}`

    const hourCount = frequency / ONE_HOUR

    if (hourCount < 24) return `${hourCount > 1 ? hourCount + ' ' : ''}hour${hourCount > 1 ? 's' : ''}`

    const dayCount = frequency / ONE_DAY

    return `${dayCount > 1 ? dayCount + ' ' : ''}day${dayCount > 1 ? 's' : ''}`
  }

  if (!session || !session.user) return <div />

  return (
    <div className="w-96 p-4" onSubmit={(e) => createWatch(e)}>
      {
        isAddingWatchOptions ? (
          <>
            <a href="#" onClick={(e) => toggleWatchOptions(e)}>
              <FontAwesomeIcon icon={faArrowLeft} />
              <span className="ml-2">Back</span>
            </a>
            <div className="flex justify-between items-end mt-2 mb-4">
              <h3 className="text-xl">
                Set rules
              </h3>
              <TextInput name="ShopFilter" type="text" placeholder="Filter shops" value={shopFilter} update={(value) => setShopFilter(value)} />
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto">
              {
                shopsForOptions.map(shop => (
                  <WatchOptionsForm
                    key={`${shop}-watchOptions`}
                    shop={shops[shop]}
                    watchOptions={shopRules[shop] || watchOptionsTemplate}
                    update={(options: WatchOptions) => setShopRules(prev => ({ ...prev, [shop]: options }))}
                  />
                ))
              }
            </div>
          </>
        ) : (
          <>
            {
              !router.pathname.includes('profile') && (
                <div className="mb-4">
                  <Notice>
                    Watches notify you when new listings are found. <br />
                    <a href="/faq#Watches" target="_blank">
                      <span className="mr-2">Learn more</span>
                      <FontAwesomeIcon icon={faExternalLink} />
                    </a>
                  </Notice>
                </div>
              )
            }
            <div className="flex mb-2 text-xl">
              <p>
                Shops to watch
              </p>
              <div className="text-lg ml-4">
                <input type="checkbox" name="all-shops" checked={shopsToSearch.length === Object.keys(shops).length} onChange={() => toggleShop(null)} />
                <label className="ml-2 cursor-pointer" htmlFor="all-shops" onClick={() => toggleShop(null)}>
                  <span>All</span>
                </label>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {
                Object.keys(shops).sort().map(shop => {
                  const shopInfo = shops[shop]
                  return (
                    <div key={shop} className="flex items-center my-2 mr-4">
                      <input type="checkbox" name={shop} checked={shopsToSearch.includes(shop)} onChange={() => toggleShop(shop)} />
                      <label className="relative flex items-center ml-2 cursor-pointer" htmlFor={shop} onClick={() => toggleShop(shop)}>
                        <span className="mr-2">{shops[shop].name}</span>
                        {
                          shopInfo.restockPotential && (
                            <Tooltip info="High restock potential" fullWidth>
                              <span className="text-green-500 dark:text-green-400">
                                <FontAwesomeIcon icon={faBoxesStacked} />
                              </span>
                            </Tooltip>
                          )
                        }
                      </label>
                    </div>
                  )
                })
              }
            </div>
            <hr className="mt-4 border-zinc-300 dark:border-zinc-700" />
            <div className="mt-4">
              <div className="mb-2">
                <Toggle checked={hasMaxPrice} action={() => setHasMaxPrice(prev => !prev)}>
                  Set a maximum price
                </Toggle>
              </div>
              {
                hasMaxPrice && (
                  <div className="flex">
                    <TextInput className="flex-grow" name="price" type="number" value={maximumPrice.toString()} update={(value) => setMaximumPrice(parseFloat(value))} />
                    <select
                      id="CurrencySelect"
                      className="h-8 ml-2 px-2 rounded-md shadow-md cursor-pointer"
                      name="currency"
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                    >
                      {
                        cc.codes().map(code => (
                          <option key={code} value={code}>
                            {code}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                )
              }
            </div>
            <hr className="mt-3 mb-2 border-zinc-300 dark:border-zinc-700" />
            <div className="relative flex justify-start items-center">
              <Toggle
                checked={activeSearch}
                action={() => setActiveSearch(prev => !prev)}
              >
                <span className="mr-2">
                  Active search
                </span>
              </Toggle>
              <Tooltip
                icon={faQuestionCircle}
                info="Automatically searches for new results at regular intervals in exchange for Watch Points."
              />
              {
                activeSearch && (
                  <p className="grow text-right">
                    <a href="#" className="text-md" onClick={(e) => toggleWatchOptions(e)}>Set rules</a>
                  </p>
                )
              }
            </div>
            {
              activeSearch && (
                <div>
                  <p className="mt-1">
                    Search frequency - every {getReadableFrequency()}
                  </p>
                  <Root
                    className="relative block w-full h-2 mt-2"
                    defaultValue={[0]}
                    value={[frequencyIndex]}
                    max={frequencies.length - 1}
                    step={1}
                    onValueChange={(value) => setFrequencyIndex(value[0])}
                  >
                    <Track className="absolute block w-full h-2 rounded shadow-inner bg-zinc-400 dark:bg-zinc-600" />
                    <Thumb className="absolute -top-1 -left-2 block w-4 h-4 rounded-xl shadow-[0_0_4px_2px] shadow-sky-400 bg-white" aria-label="Search frequency" />
                  </Root>
                  <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
                    The watch will be automatically searched once <strong>every {getReadableFrequency()}</strong> <br />
                    <strong className={!hasEnoughWatchPoints ? 'text-red-500' : ''}>{shopsToSearch.length}</strong> Watch Points will be consumed each time. <br />
                  </p>
                  <p className="mt-1 italic text-sm text-zinc-600 dark:text-zinc-400">
                    Adding or removing shops will change this amount.
                  </p>
                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                    You have <strong>{session.user.watchPoints || 0}</strong> Watch Point{session.user.watchPoints && session.user.watchPoints === 1 ? '' : 's'}.
                  </p>
                  <p className="mt-1 italic text-sm text-zinc-600 dark:text-zinc-400">
                  The automatic searches will stop once this number reaches 0 or if you deactivate Active Search.
                  </p>
                  {
                    !hasEnoughWatchPoints && (
                      <>
                        <p className="my-1 text-sm text-zinc-600 dark:text-zinc-400">
                          <strong className="text-red-500">You do not have enough Watch Points.</strong><br />
                          {
                            (session.user.watchPoints || 0) > 0 ? (
                              <strong className="text-red-500">The watch will be searched once but some shops will not be searched.</strong>
                            ) : (
                              <strong className="text-red-500">The watch will not be automatically searched until you obtain Watch Points.</strong>
                            )
                          }
                        </p>
                        <Button className="text-sm" action={() => setWatchPointsShopIsOpen(true)} isFullWidth>
                          <FontAwesomeIcon icon={faArrowRight} />
                          <span className="ml-2">
                            Buy Watch Points
                          </span>
                        </Button>
                      </>
                    )
                  }
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
            <hr className="mt-2 border-zinc-300 dark:border-zinc-700" />
            <div className="flex items-start mt-4">
              <Button isLoading={isLoading} action={() => createWatch()}>
                Confirm
              </Button>
            </div>
          </>
        )
      }
    </div>
  )
}
