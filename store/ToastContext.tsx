import { useState, createContext, useContext } from "react"

const useToastController = () => {
  const [text, setText] = useState('')
  const [type, setType] = useState('info')
  const [hidden, setHidden] = useState(true)

  const updateToast = (newText: string, newType: string) => {
    setText(newText)
    setType(newType)
    setHidden(false)

    setTimeout(() => {
      setHidden(true)
    }, 5000)
  }

  return { text, type, hidden, updateToast }
}

const ToastContext = createContext<ReturnType<typeof useToastController>>({
  text: '',
  type: '',
  hidden: true,
  updateToast: () => {}
})

export const ToastProvider = ({ children }: { children: React.ReactNode }) => (
  <ToastContext.Provider value={useToastController()}>
    {children}
  </ToastContext.Provider>
)

export const useToast = () => useContext(ToastContext)
