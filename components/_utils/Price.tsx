import { useEffect, useState } from "react"
import getSymbolFromCurrency from "currency-symbol-map"
import { useCurrency } from "../../store/CurrencyContext"
import convertPrice from "../../mixins/convertPrice"
import LoadingSpinner from "./LoadingSpinner"

export default function PriceDisplay ({ price, currencyFrom = 'JPY', currencyTo }: { price: number, currencyFrom?: string, currencyTo?: string }) {
  const { currency, currencyIsLoading } = useCurrency()
  const [convertedPrice, setConvertedPrice] = useState<number | null>(null)
  const priceString = convertedPrice !== null && !isNaN(convertedPrice) ? `${getSymbolFromCurrency(currencyTo || currency)}${Math.round(convertedPrice)}` : `${getSymbolFromCurrency(currencyFrom)}${Math.round(price)}`

  const getConvertedPrice = () => {
    const newConvertedPrice = convertPrice(price, currencyFrom, currencyTo || currency)

    setConvertedPrice(newConvertedPrice)
  }

  useEffect(() => {
    if (!currencyIsLoading) getConvertedPrice()
  }, [price, currencyFrom, currency, currencyTo, currencyIsLoading])
  return (
    !currencyIsLoading ? (
      <span>
        {priceString} 
      </span>
    ) : (
      <LoadingSpinner />
    )
  )
}
