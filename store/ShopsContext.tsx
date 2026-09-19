import { useState, createContext, useContext, useEffect } from "react"
import { shops } from "../data/shopsClient"

const useShopsController = () => {
  const [userDisabledShopsHaveLoaded, setHasLoaded] = useState(false)
  const [disabledShops, setDisabledShops] = useState<string[]>([])

  useEffect(() => {
    const storedShops = JSON.parse(localStorage.getItem("disabledShops") || 'null')

    setDisabledShops(storedShops !== null ? storedShops : [])
    setHasLoaded(true)
  }, [])

  const updateShops = (newShops: string[]) => {
    localStorage.setItem("disabledShops", JSON.stringify(newShops))

    setDisabledShops(newShops)
  }

  const enabledShops = Object.keys(shops).filter(shop => !disabledShops.includes(shop))

  return { enabledShops, disabledShops, userDisabledShopsHaveLoaded, updateShops }
}

const ShopsContext = createContext<ReturnType<typeof useShopsController>>({
  enabledShops: [],
  disabledShops: [],
  userDisabledShopsHaveLoaded: false,
  updateShops: () => {}
})

export const ShopsProvider = ({ children }: { children: React.ReactNode }) => (
  <ShopsContext.Provider value={useShopsController()}>
    {children}
  </ShopsContext.Provider>
)

export const useShops = () => useContext(ShopsContext)
