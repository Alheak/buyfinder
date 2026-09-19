import { GetServerSideProps } from "next"
import Link from "next/link"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../api/auth/[...nextauth]"
import { Listing } from "../../../types/Listing"
import Button from "../../../components/_utils/Button"
import { useState } from "react"
import PriceDisplay from "../../../components/_utils/Price"
import { Figure } from "../../../types/Figure"
import { shops } from "../../../data/shopsClient"
import Tag from "../../../components/_utils/Tag"
import { useRouter } from "next/router"

export const getServerSideProps: GetServerSideProps = async ({ req, res, params, query }) => {
  try {
    const session = await getServerSession(req, res, authOptions)
    const figureRes = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/figures/figure?_id=${params?._id}`, {
      headers: {
        'X-Session-Token': JSON.stringify(session)
      }
    })
    const figure = await figureRes.json() as Figure
    const type = !!query?.type ? query.type : 'toCheck'
    const listingsRes = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/listings/${type}?_id=${params?._id}`, {
      headers: {
        'X-Session-Token': JSON.stringify(session)
      }
    })
    const listings = await listingsRes.json() as Listing[]
  
    return {
      props: {
        figure,
        listings,
        type
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

export default function AdminListings ({ figure, listings, type }: { figure: Figure, listings: Listing[], type: 'toCheck' | 'checked' }) {
  const router = useRouter()
  const [loading, setLoading] = useState<number[]>([])

  async function setListingisWrong (index: number, isWrong: boolean) {
    if (loading.includes(index)) return

    const listing = listings[index]

    setLoading(prev => [...prev, index])

    try {
      const res = await fetch('/api/listings/setValidity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: listing._id.toString(),
          isWrong
        })
      })
      
      if (res.ok) router.replace(router.asPath)
    } catch (error) {
      console.error(error)
    }

    setLoading(prev => [...prev.filter(prevIndex => prevIndex !== index)])
  }

  return (
    <section className="container mx-auto">
      <h1 className="mt-4 text-xl">
        <p>
          <span>Listings for</span> <Link href={`/figure/${figure.slug || figure._id.toString()}`}>{figure.name}</Link>
        </p>
        {
          !!figure.mfcLink && (
            <p>
              <a href={figure.mfcLink} target="_blank" rel="nofollow noreferrer">See MFC entry</a>
            </p>
          )
        }
      </h1>
      <div className="flex mt-4 px-4 rounded-t-md">
        <Link
          href={`/admin/listings/${figure._id.toString()}?type=toCheck`}
          className={`grow block p-2 rounded-tl-md text-center ${type === 'toCheck' ? 'text-black dark:text-white bg-white dark:bg-zinc-800' : 'bg-zinc-100 dark:bg-zinc-900'}`}
        >
          Unverified
        </Link>
        <Link
          href={`/admin/listings/${figure._id.toString()}?type=checked`}
          className={`grow block p-2 text-center ${type === 'checked' ? 'text-black dark:text-white bg-white dark:bg-zinc-800' : 'bg-zinc-100 dark:bg-zinc-900'}`}
        >
          Verified
        </Link>
      </div>
      <div className="flex flex-col">
        {
          listings.map((listing, index) => {
            return (
              <div key={listing._id.toString()} className="flex flex-col mt-4 p-4 shadow-md rounded-md bg-zinc-800">
                <h2>
                  {
                    listing.isWrong !== undefined && (
                      <Tag text={listing.isWrong ? 'Wrong' : 'Correct'} color="text-white" bgColor={listing.isWrong ? 'bg-red-500' : 'bg-green-500'} />
                    )
                  }
                  <p>
                    <span>Listing: </span>
                    <a href={listing.url} target="_blank" rel="nofollow noreferrer">{listing.title || 'Untitled'}</a>
                  </p>
                  <p>
                    {shops[listing.shop]?.name || listing.shop} - <PriceDisplay price={listing.price} currencyFrom={listing.currency || 'JPY'} /> - <span>{listing.condition}</span>
                  </p>
                  {
                    !!listing.searchUsed && (
                      <p>
                        <span>Search used: </span>
                        <span>{listing.searchUsed}</span>
                      </p>
                    )
                  }
                  {
                    listing.isAccurate !== undefined && (
                      <p>
                        {listing.isAccurate ? 'High' : 'Low'} confidence accuracy
                      </p>
                    )
                  }
                </h2>
                <div className="flex mt-4 gap-4">
                  <Button bgColor="bg-green-500" isLoading={loading.includes(index)} action={() => setListingisWrong(index, false)}>
                    Correct
                  </Button>
                  <Button bgColor="bg-red-500" isLoading={loading.includes(index)} action={() => setListingisWrong(index, true)}>
                    Wrong
                  </Button>
                </div>
              </div>
            )
          })
        }
      </div>
    </section>
  )
}
