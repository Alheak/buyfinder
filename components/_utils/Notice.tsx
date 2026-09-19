import { faCheckCircle, faExclamationCircle, faInfoCircle, faTimesCircle, faWarning } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

export default function Notice ({ children, type = 'info', fullWidth = false, position = 'left', closable = false, onClose = () => {} }: { children: React.ReactNode, type?: 'info' | 'info-light' | 'success' | 'warning' | 'danger', fullWidth?: boolean, position?: 'left' | 'top', closable?: boolean, onClose?: () => void }) {
  const colors = () => {
    switch (type) {
      case 'info':
        return 'text-slate-800 dark:text-slate-100 bg-slate-200 dark:bg-slate-700'

      case 'info-light':
        return 'text-sky-900 bg-sky-200'

      case 'success':
        return 'text-white bg-green-600'

      case 'warning':
        return 'text-white bg-yellow-600'

      case 'danger':
        return 'text-white bg-red-600'
    }
  }

  const sideColor = () => {
    switch (type) {
      case 'info':
        return 'text-white bg-slate-400 dark:bg-slate-800'

      case 'info-light':
        return 'text-white bg-sky-500'

      case 'success':
        return 'text-white bg-green-800'

      case 'warning':
        return 'text-white bg-yellow-800'

      case 'danger':
        return 'text-white bg-red-800'
    }
  }

  const icon = () => {
    switch (type) {
      case 'info':
        return faInfoCircle

      case 'info-light':
        return faInfoCircle

      case 'success':
        return faCheckCircle

      case 'warning':
        return faWarning

      case 'danger':
        return faExclamationCircle
    }
  }

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'max-w-lg'} rounded-md shadow-md`}>
      {
        closable && (
          <button title="Close this notice" className="absolute top-1 right-2" onClick={() => onClose()}>
            <FontAwesomeIcon icon={faTimesCircle} />
          </button>
        )
      }
      <div className={`flex ${position === 'top' ? 'flex-col' : ''}`}>
        <figure className={`flex justify-center items-center ${position === 'top' ? 'w-full p-2 rounded-t-md' : 'w-min p-4 rounded-l-md'} ${sideColor()}`}>
          <FontAwesomeIcon icon={icon()} />
        </figure>
        <div className={`w-full p-3 ${colors()} ${position === 'top' ? 'rounded-b-md' : 'rounded-r-md'}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
