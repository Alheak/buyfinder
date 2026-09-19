import { useCallback, useEffect, useState } from 'react'
import type { Figure } from '../../types/Figure'
import LoadingSpinner from '../_utils/LoadingSpinner'
import { barcodeRegex } from '../../mixins/barcodeRegex'
import FigureCard from '../Figures/FigureCard'

export default function LastSearch ({ lastSearch }: { lastSearch: string }) {
  const [figure, setFigure] = useState<Figure | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const CLASSES = 'flex items-center w-full h-24 rounded-md shadow-md'

  const getFigure = useCallback(async (signal: AbortSignal) => {
    let _id = lastSearch

    try {
      if (barcodeRegex.test(_id)) {
        const idRes = await fetch(`/api/figures/id?jan=${_id}`)
        _id = await idRes.json()
      }

      const res = await fetch(`/api/figures/figure?_id=${_id}`, { signal })
      const figure = await res.json() as Figure

      setFigure(figure)
    } catch (error) {
      console.error(`Couldn't get figure info for ${_id}.`)
    }

    setIsLoading(false)
  }, [lastSearch])

  useEffect(() => {
    const controller = new AbortController
    const signal = controller.signal

    getFigure(signal)

    return () => {
      controller.abort()
    }
  }, [])

  return (
    isLoading ? (
      <div className={`${CLASSES} justify-center bg-zinc-100 dark:bg-zinc-800`}>
        <LoadingSpinner />
      </div>
    ) : (
      !!figure ? (
        <FigureCard figure={figure} />
      ) : (
        <div className={`${CLASSES} justify-center text-black dark:text-white bg-white dark:bg-zinc-800`}>
          Could not fetch figure data
        </div>
      )
    )
  )
}