import { GetServerSideProps } from 'next'
import { getServerSession } from "next-auth"
import { authOptions } from "./api/auth/[...nextauth]"
import Head from 'next/head'
import { useEffect, useState } from 'react'
import type { Listing } from '../types/Listing'
import Search from '../components/Navbar/Search'
import LastSearch from '../components/Figure/LastSearch'
import { Figure } from '../types/Figure'
import FigureCard from '../components/Figures/FigureCard'
import { Watch } from '../types/Watch'
import WatchCard from '../components/Profile/WatchCard'
import Link from 'next/link'

interface LastSearch { [key: string]: Listing }
interface HomeProps {
  mostSearched: Figure[]
  mostWatched: Figure[]
  watches: Watch[]
}

export const getServerSideProps: GetServerSideProps = async ({ req, res, params }) => {
  const props: HomeProps = {
    mostSearched: [],
    mostWatched: [],
    watches: []
  }

  try {
    const mostSearchedRes = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/figures/mostSearched`)

    props.mostSearched = await mostSearchedRes.json() as Figure[]
    
    const session = await getServerSession(req, res, authOptions)
  
    if (session) {
      const res = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/watches/?limit=5`, {
        headers: {
          'X-Session-Token': JSON.stringify(session)
        }
      })

      props.watches = await res.json() as Watch[]
    }

    if (!props.watches || !props.watches.length) {
      const mostWatchedRes = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/figures/mostWatched`)

      props.mostWatched = await mostWatchedRes.json() as Figure[]
    }
  
    return { props }
  } catch (error) {
    return { props }
  }
}

export default function Home({ mostSearched, mostWatched, watches }: { mostSearched: Figure[], mostWatched: Figure[], watches: Watch[] }) {
  // const [searchType, setSearchType] = useState('buy')
  const [lastSearches, setLastSearches] = useState<string[]>([])

  function clearLastSearches (e: React.SyntheticEvent) {
    e.preventDefault()

    localStorage.removeItem('searchHistory')
    localStorage.removeItem('lastFigures')

    setLastSearches([])
  }

  useEffect(() => {
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]')

    if (!searchHistory.length) searchHistory = JSON.parse(localStorage.getItem('lastFigures') || '[]').map((lastSearch: LastSearch) => Object.keys(lastSearch)[0])

    setLastSearches(searchHistory)

    return () => {
      setLastSearches([])
    }
  }, [])

  return (
    <>
      <Head>
        <title>buyfinder</title>
      </Head>

      <div className="container flex-grow flex flex-col justify-between items-center mx-auto">
        <section className="flex-grow max-w-lg w-full min-h-[24rem] h-full m-auto mt-4 px-4 flex flex-col justify-center items-center z-10">
          {/* <div className="flex items-center w-full px-2 text-sm">
            <p className="mr-2 text-zinc-90 dark:text-zinc-50">I'm looking to</p>
            <a className={`${searchType === 'buy' ? 'font-bold bg-zinc-800' : 'bg-zinc-900'} transition-colors duration-300 shadow-md rounded-t-md px-4 py-2 hover:no-underline focus:no-underline text-black dark:text-white`} href="#" onClick={() => setSearchType('buy')}>Buy</a>
            <a className={`${searchType === 'sell' ? 'font-bold bg-zinc-800' : 'bg-zinc-900'} transition-colors duration-300 shadow-md rounded-t-md px-4 py-2 hover:no-underline focus:no-underline text-black dark:text-white`} href="#" onClick={() => setSearchType('sell')}>Sell</a>
          </div> */}
          <Search />
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 w-full gap-2">
        <section className="flex flex-col w-full mx-auto my-4 px-4 justify-start">
          <h2 className="flex justify-between items-end w-full my-4 text-xl text-left font-bold">
            <span>
              My last searches
            </span>
            <a className="text-sm" href="#" onClick={(e) => clearLastSearches(e)}>Clear</a>
          </h2>
          {
            !!lastSearches && !!lastSearches.length ? (
              <div className="flex flex-col w-full gap-4">
                {
                  lastSearches.map(lastSearch => (
                    <LastSearch key={lastSearch} lastSearch={lastSearch} />
                  ))
                }
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center w-full h-full rounded-md bg-zinc-200 dark:bg-black/25">
                <p className="text-zinc-500 text-center">No searches yet</p>
              </div>
            )
          }
        </section>
        <section className="flex flex-col w-full mx-auto my-4 px-4 justify-start">
          <h2 className="w-full my-4 text-xl text-left font-bold">
            Most searched (last 3 days)
          </h2>
          {
            !!mostSearched && !!mostSearched.length ? (
              <div className="flex flex-col w-full gap-4">
                {
                  mostSearched.map(figure => (
                    <FigureCard key={figure._id.toString()} figure={figure} />
                  ))
                }
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center w-full h-full rounded-md bg-zinc-200 dark:bg-black/25">
                <p className="text-zinc-500">No data</p>
              </div>
            )
          }
        </section>
        {
          (!!watches && !!watches.length) ? (
            <section className="flex flex-col w-full mx-auto my-4 px-4 justify-start">
              <h2 className="flex justify-between items-end w-full my-4 text-xl text-left font-bold">
                <span>
                  My watches
                </span>
                <Link className="text-sm" href="/profile/watches">Manage</Link>
              </h2>
              <div className="flex flex-col w-full gap-4">
                {
                  watches.map(watch => (
                    <WatchCard key={watch._id.toString()} watch={watch} controls={false} />
                  ))
                }
              </div>
            </section>
          ) : (
            <section className="flex flex-col w-full mx-auto my-4 px-4 justify-start">
              <h2 className="w-full my-4 text-xl text-left font-bold">
                Most watched (last 30 days)
              </h2>
              {
                !!mostWatched && !!mostWatched.length ? (
                  <div className="flex flex-col w-full gap-4">
                    {
                      mostWatched.map(figure => (
                        <FigureCard key={figure._id.toString()} figure={figure} />
                      ))
                    }
                  </div>
                ) : (
                  <div className="flex flex-col justify-center items-center w-full h-full rounded-md bg-zinc-200 dark:bg-black/25">
                    <p className="text-zinc-500">No data</p>
                  </div>
                )
              }
            </section>
          )
        }
        </div>
      </div>
    </>
  )
}
