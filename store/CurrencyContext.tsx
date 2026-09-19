import { useState, createContext, useContext, useEffect } from "react"

const useCurrencyController = () => {
  const [currency, setCurrency] = useState("JPY")
  const [currencyIsLoading, setCurrencyIsLoading] = useState(false)

  const getExchangeRates = async (currency: string) => {
    const storageKey = `exchangeRates[${currency}]`
    const storedRates = JSON.parse(localStorage.getItem(storageKey) || 'null')
    const now = Date.now()

    if (!!storedRates && (storedRates.timestamp + 1000 * 60 * 60 * 24) > now) return

    setCurrencyIsLoading(true)

    try {
      const res = await fetch(`${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/api/rates?currency=${currency}`)
      const exchangeRates = await res.json()
    
      if (exchangeRates) localStorage.setItem(storageKey, JSON.stringify({ rates: exchangeRates, timestamp: Date.now() }))
    } catch (error) {
      console.error('Couldn\'t fetch exchange rates')
    }

    setCurrencyIsLoading(false)
  }

  const updateCurrency = async (newCurrency: string) => {
    newCurrency = newCurrency.toUpperCase()

    await getExchangeRates(newCurrency)

    localStorage.setItem("currency", newCurrency)

    setCurrency(newCurrency)
  }

  useEffect(() => {
    const storedCurrency = localStorage.getItem("currency")?.toUpperCase()

    if (storedCurrency) setCurrency(storedCurrency)

    getExchangeRates(storedCurrency || 'JPY')
  }, [])

  return { currency, currencyIsLoading, updateCurrency }
}

const CurrencyContext = createContext<ReturnType<typeof useCurrencyController>>({
  currency: "",
  currencyIsLoading: false,
  updateCurrency: async () => {}
})

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => (
  <CurrencyContext.Provider value={useCurrencyController()}>
    {children}
  </CurrencyContext.Provider>
)

export const useCurrency = () => useContext(CurrencyContext)
