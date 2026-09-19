import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useState } from "react"

export default function Tooltip ({ children, icon, info, className, fontSize = 'text-sm', align, fullWidth }: {
  children?: React.ReactNode , icon?: IconProp, info: string, className?: string, fontSize?: string, align?: 'left' | 'right', fullWidth?: boolean
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  function toggleShowTooltip(e: React.SyntheticEvent) {
    e.preventDefault()

    setShowTooltip(prev => !prev)
  }

  return (
    <div
      className={className || ''}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={fontSize}>
        <div
          className="inline-block flex items-center w-full"
          onTouchStart={toggleShowTooltip}
        >
          {
            !!icon && (
              <FontAwesomeIcon icon={icon} />
            )
          }
          {
            !!children && (
              <div className={`${!!icon ? 'ml-2' : ''} underline decoration-dotted`}>
                {children}
              </div>
            )
          }
        </div>
      </div>
      <p
        className={
          `absolute ${!align ? 'left-0 right-0' : `${align}-0`} ${fullWidth ? '' : 'max-w-full'} w-max px-3 py-2 rounded-lg shadow-lg text-sm text-slate-700 dark:text-slate-200 bg-slate-300 dark:bg-slate-700 z-10` +
          (showTooltip ? "" : " hidden")
        }
      >
        {info}
      </p>
    </div>
  )
}
