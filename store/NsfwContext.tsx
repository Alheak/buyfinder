import { useState, createContext, useContext, useEffect } from "react"

const useNsfwController = () => {
  const [allowNsfw, setNsfw] = useState(false)

  function updateNsfw (newNsfw: boolean) {
    setNsfw(newNsfw)
    
    localStorage.setItem('nsfw', newNsfw ? 'true' : 'false')
  }

  useEffect(() => {
    const storedNsfw = localStorage.getItem('nsfw') === 'true'

    setNsfw(storedNsfw)
  }, [])

  return { allowNsfw, updateNsfw }
}

const NsfwContext = createContext<ReturnType<typeof useNsfwController>>({
  allowNsfw: false,
  updateNsfw: () => {}
})

export const NsfwProvider = ({ children }: { children: React.ReactNode }) => (
  <NsfwContext.Provider value={useNsfwController()}>
    {children}
  </NsfwContext.Provider>
)

export const useNsfw = () => useContext(NsfwContext)
