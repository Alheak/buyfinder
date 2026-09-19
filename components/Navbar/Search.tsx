import Router, { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import debounce from 'lodash/debounce'
import LoadingSpinner from '../_utils/LoadingSpinner'
import { useLoading } from '../../store/LoadingContext'
import { useToast } from '../../store/ToastContext'
import { barcodeRegex } from '../../mixins/barcodeRegex'
import { mfcLinkRegex } from '../../mixins/mfcLinkRegex'
import { Figure } from '../../types/Figure'
import { imageSrcRegex } from '../../mixins/imageSrcRegex'
import { useClick } from '../../store/ClickContext'

export default function Search () {
  const router = useRouter()
  const { isLoading, updateLoading } = useLoading()
  const { clickTarget } = useClick()
  const { updateToast } = useToast()
  const [query, setQuery] = useState('')
  const [figureId, setFigureId] = useState<string | null>(null)
  const [results, setResults] = useState<Figure[]>([])
  const [showResults, setShowResults] = useState(true)
  const [watchForResults, setWatchForResults] = useState(false)
  const [searchIsLoading, setSearchIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')

  const isHomePage = router.pathname === '/'
  
  const matchedMfcItem = (query.match(mfcLinkRegex) || [])[1]
  const matchedJan = (query.match(barcodeRegex) || [])[0]

  const delayedSearch = useCallback(debounce((searchQuery) => searchFigures(searchQuery), 600), [])

  const getFigureId = async (url: string) => {
    updateLoading(true)
    setLoadingText('Retrieving figure info...')

    try {
      const res = await fetch(url)
      const newFigureId = await res.json()

      if (newFigureId !== figureId) {
        setFigureId(newFigureId)
      } else {
        updateLoading(false)
        setLoadingText('')
      }
    } catch (error) {
      updateLoading(false)
      setLoadingText('')
      updateToast(`Something went wrong trying to parse the ${matchedJan ? 'JAN. Retry with a MFC link instead.' : 'link. Retry with a JAN instead.'}`, 'error')
    }
  }

  async function searchFigures (searchQuery: string) {
    if (searchIsLoading || matchedJan || matchedMfcItem) return

    if (!searchQuery) {
      setResults([])

      return
    }

    setSearchIsLoading(true)

    try {
      const res = await fetch(`/api/figures/search?query=${searchQuery}`)
      const searchResults = await res.json() as Figure[]

      setResults(searchResults)
    } catch (error) {
      console.error('Error when searching for figures')
    }

    setSearchIsLoading(false)
  }

  function updateQuery (e: React.SyntheticEvent) {
    const target = e.target as HTMLInputElement
    const value = target.value

    setQuery(value)
    delayedSearch(value)
  }

  function setupGoToFirstResult (e: React.KeyboardEvent) {
    if (e.key === 'Enter') !isLoading && results[0] ? goToFirstResult() : setWatchForResults(true)
  }

  function goToFirstResult () {
    if (!results[0]) return

    updateLoading(true)
    setWatchForResults(false)
    setFigureId(results[0].slug || results[0]._id.toString())
  }

  useEffect(() => {
    if (!matchedMfcItem) return

    getFigureId(`/api/figures/mfc?item=${matchedMfcItem}`)
  }, [matchedMfcItem])

  useEffect(() => {
    if (!matchedJan) return

    getFigureId(`/api/figures/jan?jan=${matchedJan}`)
  }, [matchedJan])

  useEffect(() => {
    if (!figureId || figureId === router.query._id) return

    router.replace(`/figure/${figureId}`)
  }, [figureId])

  useEffect(() => {
    if (watchForResults && results[0]) goToFirstResult()
  }, [JSON.stringify(results)])

  useEffect(() => {
    if (!clickTarget) return

    if (clickTarget.id === 'SearchComponent') {
      setShowResults(true)

      return
    }

    let currElement: Element | HTMLElement = clickTarget

    while (currElement.parentElement) {
      if (currElement.parentElement.id === 'SearchComponent') {
        setShowResults(true)

        return
      }

      currElement = currElement.parentElement
    }

    setShowResults(false)
  }, [clickTarget])

  return (
    <div id="SearchComponent" className={`${!isHomePage ? 'md:relative' : 'relative'} md:relative w-full`}>
      <input
        type="text"
        name="searchBar"
        id="SearchBar"
        className={`relative w-full p-2 rounded-lg ${!isHomePage ? 'shadow-inner bg-zinc-50 dark:bg-zinc-800' : 'shadow-md bg-white dark:bg-zinc-800'} z-20`}
        placeholder="Enter keywords, a JAN or a MFC link"
        value={query}
        onKeyDown={setupGoToFirstResult}
        onChange={updateQuery}
        disabled={isLoading}
        autoComplete="off"
      />
      {
        isLoading && (
          <p className={`absolute top-0 right-0 bottom-0 left-0 flex justify-center items-center p-2 rounded-md shadow-md italic text-zinc-700 dark:text-zinc-300 ${!isHomePage ? 'bg-zinc-100/80 dark:bg-zinc-900/80' : 'bg-zinc-50/80 dark:bg-black/80'} z-20`}>
            <LoadingSpinner />
            <span className="ml-4">
              {loadingText || 'Doing important stuff...'}
            </span>
          </p>
        )
      }
      {
        (showResults && !matchedMfcItem && !matchedJan && ((results && !!results.length) || !!query || searchIsLoading)) && (
          <div className={`${!isHomePage ? 'top-14 md:top-0 md:pt-10 md:rounded-md' : 'top-0 pt-10 rounded-md'} absolute right-0 left-0 flex flex-col divide-y divide-zinc-200 dark:divide-zinc-700 shadow-md bg-zinc-50 dark:bg-zinc-800 z-10`}>
            {
              searchIsLoading ? (
                <div className="flex justify-center items-center p-4 text-black dark:text-white">
                  <LoadingSpinner />
                </div>
              ) : (
                !!results && !!results.length ? (
                  <>
                    {
                      results.map(result => (
                        <Link
                          key={result._id.toString()}
                          href={`/figure/${result.slug || result._id.toString()}`}
                          className="flex p-2 transition-colors text-black dark:text-white hover:bg-slate-200 hover:dark:bg-gray-600 hover:no-underline"
                          onClick={() => updateLoading(true)}
                        >
                          <figure className="w-14 h-12">
                            <Image
                              src={result.image && imageSrcRegex.test(result.image) ? result.image : '/404.jpg'}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover rounded-md"
                              alt="Picture of the figure"
                              priority
                            />
                          </figure>
                          <h3 className="w-full my-auto px-2 line-clamp-1" title={result.name}>{result.name}</h3>
                        </Link>
                      ))
                    }
                    {
                      results.length === 5 && (
                        <Link
                          href={`/figures?search=${query}`}
                          className="flex p-2 transition-colors text-black dark:text-white hover:bg-slate-200 hover:dark:bg-gray-600 hover:no-underline"
                        >
                          <h3 className="w-full my-auto px-2 text-center text-sm">See more results</h3>
                        </Link>
                      )
                    }
                  </>
                ) : (
                  <h3 className="w-full p-2 text-zinc-500 text-center">
                    No results
                  </h3>
                )
              )
            }
            <div className={`${!isHomePage ? 'md:rounded-b-md' : 'rounded-b-md'} px-3 py-2 md:rounded-b-md text-sm text-white bg-slate-500 dark:bg-slate-600`}>
              Not seeing what you&apos;re looking for? It might not be in our database yet. <br />
              Try using a JAN or MFC link instead.
            </div>
          </div>
        )
      }
    </div>
  )
}