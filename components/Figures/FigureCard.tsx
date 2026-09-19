import Link from 'next/link'
import Image from 'next/image'
import type { Figure } from '../../types/Figure'
import { imageSrcRegex } from '../../mixins/imageSrcRegex'
import { useNsfw } from '../../store/NsfwContext'
import FigurePriceData from '../Figure/FigurePriceData'

export default function FigureCard ({ figure }: { figure: Figure }) {
  const { allowNsfw } = useNsfw()
  const imageIsNsfw = /\[NSFW/.test(figure.name)
  const src = figure.image && imageSrcRegex.test(figure.image) && (!imageIsNsfw || (imageIsNsfw && allowNsfw)) ? figure.image : '/404.jpg'

  return (
    <Link
      className="flex items-center h-24 rounded-md shadow-md justify-start hover:no-underline transition-colors text-black dark:text-white bg-white dark:bg-zinc-800 hover:bg-slate-200 hover:dark:bg-gray-600"
      href={`/figure/${figure.slug || figure._id.toString()}`}
    >
      <figure className="w-24 h-full">
        <Image
          src={src}
          width={150}
          height={150}
          className="w-full h-full object-cover rounded-md shadow-md"
          alt="Picture of the figure"
          priority
        />
      </figure>
      <div className="relative flex flex-col justify-between items-start w-full h-full px-3 py-2">
        <h3 title={figure.name} className="w-full mb-1 line-clamp-2">{figure.name}</h3>
        {
          !!figure.priceData && (
            <FigurePriceData figure={figure} />
          )
        }
      </div>
    </Link>
  )
}
