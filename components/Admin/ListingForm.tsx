import { useState } from "react"
import cc from 'currency-codes'
import TextInput from "../_utils/TextInput"
import { shops } from "../../data/shopsClient"
import Button from "../_utils/Button"
import { useToast } from "../../store/ToastContext"

export default function ListingForm ({ close }: { close: () => void }) {
  const { updateToast } = useToast()
  const [figureId, setFigureId] = useState('')
  const [title, setTitle] = useState('')
  const [shop, setShop] = useState('')
  const [price, setPrice] = useState(0)
  const [currency, setCurrency] = useState('JPY')
  const [condition, setCondition] = useState<'new' | 'used'>('new')
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function submit () {
    if (isLoading) return

    setIsLoading(true)

    try {
      const res = await fetch('/api/listings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          figureId,
          title,
          shop,
          price,
          currency,
          condition,
          url
        })
      })

      if (res.ok) {
        close()
      } else {
        throw new Error('Error trying to create the listing')
      }
    } catch (error) {
      console.error('Error trying to create the listing', error)

      updateToast('Error trying to create the listing.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-96 p-4">
      <TextInput title="Figure ID" name="figureId" type="text" value={figureId} update={(value) => setFigureId(value)} />
      <TextInput className="mt-2" title="Title" name="title" type="text" value={title} update={(value) => setTitle(value)} />
      <div className="mt-2">
        <label htmlFor="shop">Shop</label>
        <select
          name="shop"
          className='w-full p-2 cursor-pointer rounded-lg shadow-md transition-colors bg-zinc-50 dark:bg-zinc-700 hover:bg-slate-200 hover:dark:bg-gray-600'
          onChange={(e) => setShop(e.target.value)}
          value={shop}
        >
          {
            Object.keys(shops).sort().map((shop) => (
              <option key={shop} className="bg-white dark:bg-zinc-800" value={shop}>{shops[shop].name}</option>
            ))
          }
        </select>
      </div>
      <TextInput className="mt-2" title="Price" name="price" type="number" value={price.toString()} update={(value) => setPrice(parseFloat(value))} />
      <div className="mt-2">
        <label htmlFor="currency">Currency</label>
        <select
          name="currency"
          className='w-full p-2 cursor-pointer rounded-lg shadow-md transition-colors bg-zinc-50 dark:bg-zinc-700 hover:bg-slate-200 hover:dark:bg-gray-600'
          onChange={(e) => setCurrency(e.target.value)}
          value={currency}
        >
          {
            cc.codes().map((code) => (
              <option key={code} className="bg-white dark:bg-zinc-800" value={code}>{code}</option>
            ))
          }
        </select>
      </div>
      <div className="mt-2">
        <label htmlFor="condition">Condition</label>
        <select
          name="condition"
          className='w-full p-2 cursor-pointer rounded-lg shadow-md transition-colors bg-zinc-50 dark:bg-zinc-700 hover:bg-slate-200 hover:dark:bg-gray-600'
          onChange={(e) => setCondition(e.target.value as 'new' | 'used')}
          value={condition}
        >
          <option key="new" className="bg-white dark:bg-zinc-800" value="new">New</option>
          <option key="used" className="bg-white dark:bg-zinc-800" value="used">Used</option>
        </select>
      </div>
      <TextInput className="mt-2" title="URL" name="url" type="text" value={url} update={(value) => setUrl(value)} />
      <Button className="mt-4" isLoading={isLoading} action={() => submit()}>
        Send
      </Button>
    </div>
  )
}
