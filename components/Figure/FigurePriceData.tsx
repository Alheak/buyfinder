import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons"
import { Figure } from "../../types/Figure"
import PriceDisplay from "../_utils/Price"
import Tooltip from "../_utils/Tooltip"

export default function FigurePriceData ({ figure }: { figure: Figure }) {
  const priceChange = figure.priceData && figure.priceData.priceChange ? figure.priceData.priceChange.toFixed(0) : '0'
  const priceChangeSign = parseInt(priceChange) > 0 ? '+' : ''
  const priceChangeText = priceChange !== '0' ? `${priceChangeSign}${priceChange}%` : '--'
  const priceChangeColor = priceChangeText !== '--' ? (priceChangeSign === '+' ? 'bg-green-600' : 'bg-red-600') : 'bg-stone-400 dark:bg-stone-600'

  return (
    <div className="absolute right-0 bottom-0 left-0 flex items-center h-7 bg-zinc-100 dark:bg-zinc-700">
      {
        !!figure.priceData && (
          <>
            <div className="relative flex items-center h-full px-2 py-1 bg-[#d5e1f5] dark:bg-[#2b505e]">
              <Tooltip info="Low-end price" icon={faArrowDown} fontSize="text-xs" fullWidth>
                <PriceDisplay price={figure.priceData.minPrice || figure.priceData.averagePrice} />
              </Tooltip>
            </div>
            <div className="relative flex items-center h-full px-2 py-1 bg-[#f5dcd5] dark:bg-[#5e302b]">
              <Tooltip info="High-end price" icon={faArrowUp} fontSize="text-xs" fullWidth>
                <PriceDisplay price={figure.priceData.maxPrice || figure.priceData.averagePrice} />
              </Tooltip>
            </div>
            <div className="grow" />
            <div className="relative flex justify-end items-center px-2 py-1">
              <Tooltip info="Average price" align="right" fullWidth>
                <strong>
                  <PriceDisplay price={figure.priceData.averagePrice} />
                </strong>
              </Tooltip>
            </div>
          </>
        )
      }
      <div className={`relative flex justify-end items-center h-min mr-1 px-1 py-0.5 gap-2 rounded-lg md:text-left xl:text-right text-white ${priceChangeColor}`}>
        <Tooltip info="Price change since release or earliest known price" fontSize="text-xs" align="right" fullWidth>
          <span className="text-xs">{priceChangeText}</span>
        </Tooltip>
      </div>
    </div>
  )
}
