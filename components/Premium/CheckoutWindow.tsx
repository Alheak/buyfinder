import { useEffect, useState } from "react"


const useWindowLocation = (checkoutWindow: Window) => {
  const [location, setLocation] = useState(checkoutWindow.location.href)

  useEffect(() => {
    const handlePopState = () => {
      setLocation(checkoutWindow.location.href)
    }

    checkoutWindow.addEventListener('popstate', handlePopState)

    return () => {
      checkoutWindow.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return location
}

export default function CheckoutWindow ({ checkoutWindow, onClose }: { checkoutWindow: Window, onClose: (isSuccess: boolean) => void }) {
  const location = useWindowLocation(checkoutWindow)
  const windowIsClosed = checkoutWindow && checkoutWindow.closed

  useEffect(() => {
    if (!location || location === 'about:blank') return

    const isSuccess = location.includes('?success=true')

    onClose(isSuccess)
  }, [location])

  useEffect(() => {
    if (!windowIsClosed) return
    
    onClose(false)
  }, [windowIsClosed])

  return (
    <div className="hidden" />
  )
}
