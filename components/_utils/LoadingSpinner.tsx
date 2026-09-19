import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function LoadingSpinner () {
  return (
    <span className="spin inline-flex justify-center items-center">
      <FontAwesomeIcon icon={faSpinner} />
    </span>
  )
}
