import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import Head from "next/head"
import { useRouter } from 'next/router'
import { useEffect, useState, useCallback } from 'react'
import debounce from 'lodash/debounce'
import { authOptions } from '../api/auth/[...nextauth]'
import { Figure } from '../../types/Figure'
import FigureCard from '../../components/Figures/FigureCard'
import LoadingSpinner from '../../components/_utils/LoadingSpinner'
import SideMenu from '../../components/Figures/SideMenu'
import TextInput from "../../components/_utils/TextInput"
import Select from "../../components/_utils/Select"
import Button from "../../components/_utils/Button"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowDownWideShort, faArrowUpShortWide } from "@fortawesome/free-solid-svg-icons"

export const getServerSideProps: GetServerSideProps = async ({ req, res, query }) => {
  try {
    const session = await getServerSession(req, res, authOptions)

    const paramsString = new URLSearchParams({ ...query as ({ [key: string]: string} ) }).toString()
    const figuresRes = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/figures/?${paramsString}`, {
      method: 'GET',
      headers: {
        'X-Session-Token': JSON.stringify(session)
      }
    })
    const figures = await figuresRes.json() as Figure[]
    
    const originsRes = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/origins/names`)
    const origins = await originsRes.json() as string[]

    const manufacturersRes = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/manufacturers/names`)
    const manufacturers = await manufacturersRes.json() as string[]

    const categoriesRes = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/categories/names`)
    const categories = await categoriesRes.json() as string[]

    const classificationsRes = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/classifications/names`)
    const classifications = await classificationsRes.json() as string[]
  
    return {
      props: {
        figures,
        origins,
        manufacturers,
        categories,
        classifications
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

const SORTING_TYPES: { [key: string]: string } = {
  added: 'Date added',
  release: 'Release date',
  popularity: 'Popularity',
  averagePrice: 'Average price',
  minPrice: 'Low-end price',
  maxPrice: 'High-end price',
  priceChange: 'Price change'
}

export default function Figures ({ figures, origins, manufacturers, categories, classifications }: { figures: Figure[], origins: string[], manufacturers: string[], categories: string[], classifications: string[] }) {
  const router = useRouter()
  const [results, setResults] = useState(figures)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreResults, setHasMoreResults] = useState(!!figures.length && figures.length % 40 === 0)
  const [search, setSearch] = useState(router.query.search ? decodeURI(router.query.search as string) : '')
  const [filters, setFilters] = useState<{ [key: string]: string | undefined }>({
    category: router.query.category as string | undefined,
    classification: router.query.classification as string | undefined,
    origin: router.query.origin as string | undefined,
    manufacturer: router.query.manufacturer as string | undefined
  })
  const [selectedSort, setSelectedSort] = useState(router.query.sort as string || 'added')
  const [selectedOrder, setSelectedOrder] = useState<'asc' | 'desc'>(router.query.order as ('asc' | 'desc') || 'desc')

  const [docHeight, setDocHeight] = useState(typeof window === 'undefined' ? 0 : window.document.documentElement.scrollHeight)
  const [windowHeight, setWindowHeight] = useState(typeof window === 'undefined' ? 0 : window.innerHeight)
  const [scrolledPixels, setScrolledPixels] = useState(typeof window === 'undefined' ? 0 : window.scrollY)

  const pixelsLeftToScroll = docHeight - windowHeight - scrolledPixels

  async function fetchMoreResults (newSearch: boolean = false) {
    if (isLoading || isLoadingMore || (!hasMoreResults && !newSearch)) return

    newSearch ? setIsLoading(true) : setIsLoadingMore(true)

    try {
      const params: { [key: string]: string } = {
        ...router.query,
        page: (newSearch ? 0 : page).toString()
      }

      if (router.query.search) params.search = decodeURI(router.query.search as string)

      const paramsString = new URLSearchParams(params).toString()
      const res = await fetch(`/api/figures/?${paramsString}`, {
        method: 'GET'
      })
      const newResults = await res.json() as Figure[]

      if (!newResults || newResults.length < 40) setHasMoreResults(false)

      setPage(prev => newSearch ? 1 : prev + 1)
      setResults(prev => newSearch ? newResults : [...prev, ...newResults])
    } catch (error) {
      console.error('Something went wrong trying to fetch results.')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    if (!hasMoreResults) return

    if (pixelsLeftToScroll < 360) fetchMoreResults()
  }, [pixelsLeftToScroll])

  const updateScroll = () => {
    setDocHeight(window.document.documentElement.scrollHeight)
    setWindowHeight(window.innerHeight)
    setScrolledPixels(window.scrollY)
  }

  useEffect(() => {
    window.addEventListener('resize', updateScroll)
    window.addEventListener('scroll', updateScroll, { passive: true })

    return () => {
      window.removeEventListener('resize', updateScroll)
      window.removeEventListener('scroll', updateScroll)
    }
  }, [])

  useEffect(() => {
    fetchMoreResults(true)
  }, [JSON.stringify(router.query)])

  const delayedSearch = useCallback(debounce((searchQuery) => {
    const query = { ...router.query }

    if (searchQuery) {
      query.search = encodeURI(searchQuery)
    } else {
      delete query.search
    }

    if (JSON.stringify(router.query) !== JSON.stringify(query)) router.push({ query }, undefined, { shallow: true })
  }, 600), [JSON.stringify(router.query)])

  useEffect(() => {
    delayedSearch(search)
  }, [search])

  useEffect(() => {
    const query: { [key:string]: string } = {
      ...router.query,
      ...filters,
      sort: selectedSort,
      order: selectedOrder
    }

    for (const param in query) {
      if (Object.prototype.hasOwnProperty.call(query, param)) {
        const value = query[param]

        if (!value) delete query[param]
      }
    }

    if (JSON.stringify(router.query) !== JSON.stringify(query)) router.push({ query }, undefined, { shallow: true })
  }, [JSON.stringify(router.query), JSON.stringify(filters), selectedSort, selectedOrder])

  return (
    <>
      <Head>
        <meta name="title" property="og:title" content="Browse figures" />
        <title>Browse Figures - buyfinder</title>
      </Head>

      <section className="container flex flex-col md:flex-row w-full mx-auto p-4">
        <SideMenu
          categories={categories}
          classifications={classifications}
          origins={origins}
          manufacturers={manufacturers}
          filters={filters}
          setFilters={setFilters}
        />
        <div className="flex flex-col w-full">
          <h1 className="mt-4 mb-8 text-4xl">Browse figures</h1>
          <div className="flex w-full mb-4 shadow-md rounded-md bg-zinc-50 dark:bg-zinc-700 overflow-hidden">
            <TextInput
              className="grow"
              name="searchBar"
              type="text"
              standalone={false}
              value={search}
              placeholder="Filter by keywords"
              update={(value) => setSearch(value)}
            />
            <Select name="sortSelect" id="SortSelect" value={selectedSort} standalone={false} update={(value) => setSelectedSort(value)}>
              {
                Object.keys(SORTING_TYPES).map(type => (
                  <option key={type} value={type}>{SORTING_TYPES[type]}</option>
                ))
              }
            </Select>
            <Button title={selectedOrder === 'asc' ? 'Increasing order' : 'Decreasing order'} action={() => setSelectedOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
              {
                selectedOrder === 'asc' ? (
                  <FontAwesomeIcon icon={faArrowUpShortWide} />
                ) : (
                  <FontAwesomeIcon icon={faArrowDownWideShort} />
                )
              }
            </Button>
          </div>
          <div className="relative grid grid-cols-1 xl:grid-cols-2 w-full h-min gap-4">
            {
              (!!results && !!results.length) ? (
                results.map(figure => (
                  <FigureCard key={figure._id.toString()} figure={figure} />
                ))
              ) : (
                <div className="absolute top-0 right-0 left-0 w-full p-4 text-center text-xl text-zinc-500">
                  No results
                </div>
              )
            }
            {
              isLoading && (
                <div className="absolute top-0 right-0 bottom-0 left-0 text-black dark:text-white bg-white/50 dark:bg-black/50">
                  <p className="sticky top-40 bottom-40 flex justify-center items-center">
                    <LoadingSpinner />
                    <span className="ml-2">Loading results...</span>
                  </p>
                </div>
              )
            }
            {
              isLoadingMore && (
                <div className="col-span-1 xl:col-span-2 p-4 text-black dark:text-white">
                  <p className="flex justify-center items-center">
                    <LoadingSpinner />
                    <span className="ml-2">Loading more results...</span>
                  </p>
                </div>
              )
            }
          </div>
        </div>
      </section>
    </>
  )
}
