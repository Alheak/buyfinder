export default function Tag ({ text, color = 'text-white', bgColor = 'bg-sky-700', className = '', fontSize = 'text-sm' }: { text: string, color?: string, bgColor?: string, className?: string, fontSize?: string }) {
  return (
    <span className={`h-min px-2 py-1 shadow-sm rounded-lg ${fontSize} ${color} ${bgColor} ${className}`}>
      {text}
    </span>
  )
}
