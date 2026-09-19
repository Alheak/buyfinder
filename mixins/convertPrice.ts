export default function convertPrice (price: number, currencyFrom: string, currencyTo: string) {
  if (typeof window === 'undefined') return price

  currencyFrom = currencyFrom.toUpperCase()
  currencyTo = currencyTo.toUpperCase()

  if (currencyFrom === currencyTo) return price

  const storageKey = `exchangeRates[${currencyTo}]`
  const exchangeRates = JSON.parse(localStorage.getItem(storageKey) || '{}')

  if (!exchangeRates || !exchangeRates.rates || !exchangeRates.rates[currencyFrom]) return null

  return price / exchangeRates.rates[currencyFrom]
}
