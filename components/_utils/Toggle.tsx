export default function Toggle ({ children, checked, disabled, textSize = 'lg', action }: { children: React.ReactNode, checked: boolean, disabled?: boolean, textSize?: ('sm' | 'md' | 'lg'), action: () => void }) {
  const diskPosition = () => {
    switch (textSize) {
      case 'lg':
        return '4'

      case 'md':
        return '3'

      case 'sm':
        return '2'
    }
  }

  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={checked} disabled={disabled} onChange={disabled ? () => {} : action} />
      <div className={`w-11 h-5 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 dark:peer-focus:ring-sky-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[${diskPosition()}px] after:left-[2px] ${disabled ? 'after:bg-zinc-500' : 'after:bg-white'} after:border-zinc-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-sky-600`} />
      <p className={`flex items-start ml-2 text-${textSize} ${disabled ? 'text-zinc-500' : 'text-black dark:text-white'}`}>
        {children}
      </p>
    </label>
  )
}
