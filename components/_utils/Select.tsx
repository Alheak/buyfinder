export default function Select ({ name, id, value, className = '', fullWidth = false, standalone = true, children, placeholder, required, update }: { name: string, id: string, value: any, className?: string, fullWidth?: boolean, standalone?: boolean, children: React.ReactNode, placeholder?: string, required?: boolean, update: (value: any) => void }) {
  return (
    <select
      name={name}
      id={id}
      className={`${fullWidth ? 'w-full' : ''} p-2 cursor-pointer ${standalone ? 'rounded-lg shadow-md' : ''} transition-colors bg-zinc-50 dark:bg-zinc-700 hover:bg-slate-200 hover:dark:bg-gray-600 ${className || ''}`}
      value={value}
      placeholder={placeholder}
      required={required}
      onChange={(e) => update(e.target.value)}
    >
      {
        !!placeholder && (
          <option value=""><span className="italic text-zinc-500">{placeholder}</span></option>
        )
      }
      {children}
    </select>
  )
}