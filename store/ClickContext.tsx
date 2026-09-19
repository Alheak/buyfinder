import { useState, createContext, useContext } from "react"

const useClickController = () => {
  const [clickTarget, setClickTarget] = useState<Element | null>(null)

  const updateClickTarget = (e: React.SyntheticEvent) => {
    setClickTarget(e.target as Element)
  }

  return { clickTarget, updateClickTarget }
}

const ClickContext = createContext<ReturnType<typeof useClickController>>({
  clickTarget: null,
  updateClickTarget: () => {}
})

export const ClickProvider = ({ children }: { children: React.ReactNode }) => (
  <ClickContext.Provider value={useClickController()}>
    {children}
  </ClickContext.Provider>
)

export const useClick = () => useContext(ClickContext)
