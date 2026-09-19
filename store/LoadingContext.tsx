import { useState, createContext, useContext } from "react"

const useLoadingController = () => {
  const [isLoading, setLoading] = useState(false)

  const updateLoading = (newLoading: boolean) => {
    setLoading(newLoading)
  }

  return { isLoading, updateLoading }
}

const LoadingContext = createContext<ReturnType<typeof useLoadingController>>({
  isLoading: false,
  updateLoading: () => {}
})

export const LoadingProvider = ({ children }: { children: React.ReactNode }) => (
  <LoadingContext.Provider value={useLoadingController()}>
    {children}
  </LoadingContext.Provider>
)

export const useLoading = () => useContext(LoadingContext)
