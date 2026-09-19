import { useToast } from "../../store/ToastContext"

export default function Toast () {
  const { text, type, hidden } = useToast()
  let classNames = ''

  switch (type) {
    case 'info':
      classNames = 'bg-sky-500 text-white'
      break

    case 'success':
      classNames = 'bg-green-600 text-white'
      break

    case 'error':
      classNames = 'bg-red-600 text-white'
      break
  }

  return (
    <div className={`fixed top-16 left-2/4 -translate-x-2/4 w-96 p-4 rounded-xl ${classNames} text-center drop-shadow-xl toast ${hidden && 'toast-hidden'} z-20`}>
      {text}
    </div>
  )
}
