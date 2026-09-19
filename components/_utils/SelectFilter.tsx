import { useEffect, useState } from "react"
import TextInput from "./TextInput"
import { useClick } from "../../store/ClickContext"

export default function SelectFilter ({ title = '', name = '', className = '', fullWidth = false, value = null, options = [], update }: { title: string, name: string, className?: string, fullWidth?: boolean, value?: string | null, options: string[], update: (value: null | string) => void }) {
  const { clickTarget } = useClick()
  const [filter, setFilter] = useState<string>('')
  const [selected, setSelected] = useState<null | string>(value)
  const [showOptions, setShowOptions] = useState(false)
  const filteredOptions = options.filter(option => option.toLowerCase().includes(filter.toLowerCase()))
  const id = `SelectFilter-${name}`

  function selectOption (option: string) {
    setSelected(option)
    setFilter('')
    setShowOptions(false)
  }

  function onFocus () {
    setSelected(null)
    setShowOptions(true)
  }

  useEffect(() => {
    update(selected)
  }, [selected])

  useEffect(() => {
    if (!clickTarget) return

    if (clickTarget.id === id) {
      setShowOptions(true)

      return
    }

    let currElement: Element | HTMLElement = clickTarget

    while (currElement.parentElement) {
      if (currElement.parentElement.id === id) {
        setShowOptions(true)

        return
      }

      currElement = currElement.parentElement
    }

    setShowOptions(false)
  }, [clickTarget])

  return (
    <div id={id} className={`relative ${className} ${fullWidth ? 'w-full' : ''}`}>
      <TextInput title={title} name={name} type="text" value={selected || filter} update={(value) => setFilter(value)} focus={() => onFocus()} />
      {
        showOptions && (
          <div className="absolute top-16 right-0 left-0 flex flex-col max-h-52 h-max shadow-md text-black dark:text-white bg-white dark:bg-black overflow-y-auto z-10">
            {
              !!filteredOptions && !!filteredOptions.length ?
                filteredOptions.map(option => (
                  <p
                    key={option}
                    className="p-2 hover:text-white hover:bg-slate-500 cursor-pointer"
                    onClick={() => selectOption(option)}
                  >
                    {option}
                  </p>
                )) :
                <p className="p-2 text-zinc-600 dark:text-zinc-400">No result</p>
            }
          </div>
        )
      }
    </div>
  )
}
