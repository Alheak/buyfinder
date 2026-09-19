import { PriceData } from "../../types/Figure"
import Tag from '../_utils/Tag'
import Tooltip from '../_utils/Tooltip'

export default function PriceChange ({ priceData, fontSize = 'text-sm' }: { priceData?: PriceData, fontSize?: string }) {
  const priceChange = priceData ? priceData.priceChange.toFixed(0) : '0'
  const priceChangeSign = parseInt(priceChange) > 0 ? '+' : ''
  const priceChangeText = priceChange !== '0' ? `${priceChangeSign}${priceChange}%` : '--'
  const priceChangeColor = priceChangeText !== '--' ? (priceChangeSign === '+' ? 'bg-green-600' : 'bg-red-600') : 'bg-stone-400 dark:bg-stone-600'

  return (
    <Tooltip className="text-white" info="Price change since release or earliest known price" align="right">
      <Tag text={priceChangeText} bgColor={priceChangeColor} fontSize={fontSize} />
    </Tooltip>
  )
}
