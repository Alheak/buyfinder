import convertPrice from '../../mixins/convertPrice'
import { useCurrency } from '../../store/CurrencyContext'
import { Figure } from "../../types/Figure"
import Tag from '../_utils/Tag'
import Tooltip from '../_utils/Tooltip'
import PriceChange from './PriceChange'

export default function FigurePriceData ({ figure }: {figure: Figure}) {
  const { currency } = useCurrency()
  const startingPrice = figure.priceData && figure.priceData.startingPrice ? (convertPrice(figure.priceData.startingPrice, 'JPY', currency) || 0) : 0
  const averagePrice = figure.priceData && figure.priceData.averagePrice ? (convertPrice(figure.priceData.averagePrice, 'JPY', currency) || 0) : 0

  return (
    <div className="relative flex justify-end gap-2 w-full">
      {
        !!averagePrice && (
          <>
            {/* <Tooltip info="Starting price" align="right">
              <Tag text={startingPrice.toFixed(0) + ' ' + currency} bgColor="bg-zinc-400 dark:bg-zinc-600" />
            </Tooltip> */}
            <Tooltip className="text-white" info="Current average price" align="right">
              <Tag text={averagePrice.toFixed(0) + ' ' + currency} />
            </Tooltip>
          </>
        )
      }
      <PriceChange priceData={figure.priceData} />
    </div>
  )
}
