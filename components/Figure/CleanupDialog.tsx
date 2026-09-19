import { useState } from "react"
import { useToast } from "../../store/ToastContext"
import { Figure } from "../../types/Figure"
import Button from "../_utils/Button"

export default function CleanupDialog ({ figure, close }: { figure: Figure, close: () => void }) {
  const { updateToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  async function sendRequest () {
    if (isLoading) return

    setIsLoading(true)

    try {
      const res = await fetch('/api/cleanupRequests/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          figureId: figure._id.toString(),
        })
      })

      if (res.ok) {
        updateToast('Request sent. You\'ll be notified when the clean-up is done.', 'success')

        close()
      } else {
        updateToast('Something went wrong trying to request a data clean-up.', 'error')
      }
    } catch (error) {
      updateToast('Something went wrong trying to request a data clean-up.', 'error')
    }

    setIsLoading(false)
  }

  return (
    <div className="w-96 p-4">
      <p className="mb-4">
        Items that get a high proportion of wrong listings can have price data going all over the place.
        <br /><br />
        To mitigate this, results are checked from time to time, but some items can be overlooked, leading to some charts being more inaccurate than others.
        <br /><br />
        For this reason, if you think the chart does not reflect accurately the actual price of the item, you can request an admin to clean-up the price data.
        <br /><br />
        There is still a chance the chart will still look wonky, but this might be due to other factors like the item being often sold in a set or having a low amount of data dispersed over multiple shops with highly different pricings.
      </p>
      <div className="flex gap-2">
        <Button isLoading={isLoading} action={() => sendRequest()}>
          Request clean-up
        </Button>
        <Button isLoading={isLoading} textColor="text-black dark:text-white" bgColor="bg-zinc-100 dark:bg-zinc-600 hover:bg-white hover:dark:bg-zinc-500" action={close}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
