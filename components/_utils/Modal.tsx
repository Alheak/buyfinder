import { faClose } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

export default function Modal ({ children, title = 'Attention', alignment = 'top', onClose }: { children: React.ReactNode, title?: string, alignment?: 'top' | 'center' | 'bottom', onClose: () => void }) {
  const flexAlignment = () => {
    switch (alignment) {
      case 'top':
        return 'items-start'

      case 'center':
        return 'items-center'

      case 'bottom':
        return 'items-end'

      default:
        return 'items-start'
    }
  }

  function close (e: React.SyntheticEvent) {
    e.preventDefault()

    onClose()
  }

  return (
    <div className={`fixed top-0 right-0 bottom-0 left-0 flex ${flexAlignment()} justify-center z-20`}>
      <div
        className="absolute top-0 right-0 bottom-0 left-0 bg-zinc-800/75"
        onClick={(e) => close(e)}
      />
      <div className="relative flex flex-col h-min max-h-[calc(100vh-2rem)] max-h-[calc(100svh-2rem)] mt-4 shadow-md rounded-md text-black dark:text-white bg-zinc-50 dark:bg-zinc-800">
        <h2 className="p-4 shadow-md rounded-t-md bg-zinc-100 dark:bg-zinc-700">
          <span className="text-lg">
            {title}
          </span>
          <a
            href="#"
            title="Close the window"
            className="flex justify-center items-center w-6 h-6 rounded-full bg-zinc-300 text-zinc-600 dark:bg-zinc-600 dark:text-zinc-400 float-right"
            onClick={(e) => close(e)}
          >
            <FontAwesomeIcon icon={faClose} />
          </a>
        </h2>
        <div className="overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
