import { useState } from "react"
import urlRegexSafe from 'url-regex-safe'
import { useToast } from "../../store/ToastContext"
import Button from "../_utils/Button"
import Notice from "../_utils/Notice"

export default function ShopSuggestion ({ close }: { close: () => void }) {
  const { updateToast } = useToast()
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const isValid = !!url ? urlRegexSafe({ exact: true }).test(url) : false

  async function submit () {
    if (!isValid) return
    if (isLoading) return

    setIsLoading(true)

    try {
      const res = await fetch('/api/shopSuggestions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url
        })
      })

      if (res.ok) {
        const resContent = await res.json()

        switch (resContent.shopSuggestionStatus) {
          case 'created':
            updateToast('Suggestion sent, thank you.', 'success')
            close()
            break

          case 'exists':
            updateToast('You already have suggested this website.', 'error')
            break

          default:
            updateToast('Suggestion sent, thank you.', 'success')
            close()
        }
      } else {
        updateToast('Something went wrong trying to create the suggestion.', 'error')
      }
    } catch (error) {
      updateToast('Something went wrong trying to submit the suggestion.', 'error')
    }

    setIsLoading(false)
  }

  return (
    <form className="w-96 p-4">
      <Notice>
        <p className="text-sm">
          Here you can suggest a shop to be added to the list of shops that buyfinder searches through.
          <br /><br />
          The following makes it more likely for a shop to be added:
          <ul className="ml-6 list-outside list-square">
            <li>Popularity</li>
            <li>Reliability</li>
            <li>Attractive prices</li>
            <li>Availability of items</li>
            <li>Second hand items</li>
            <li>Handles searching with a barcode/JAN</li>
          </ul>
        </p>
      </Notice>
      <br />
      <label htmlFor="ShopUrl">URL to the shop&apos;s website:</label>
      <input
        id="ShopUrl"
        name="shopUrl"
        className="w-full mb-4 border"
        value={url}
        type="url"
        
        onChange={(e) => setUrl(e.target.value)}
      />
      <Button disabled={!isValid} isLoading={isLoading} action={() => submit()}>
        Send
      </Button>
    </form>
  )
}
