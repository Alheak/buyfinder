import LoadingSpinner from "../_utils/LoadingSpinner"

export default function Loading () {
  return (
    <div className="fixed top-0 right-0 bottom-0 left-0 flex justify-center items-center text-black dark:text-white bg-white/50 dark:bg-black/50 z-20">
      <LoadingSpinner />
    </div>
  )
}
