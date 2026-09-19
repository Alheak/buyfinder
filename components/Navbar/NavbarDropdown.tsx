import { useNsfw } from "../../store/NsfwContext"
import Toggle from "../_utils/Toggle"
import CurrencySelect from "./CurrencySelect"
import SearchedShops from "./SearchedShops"

export default function NavbarDropdown ({ isShowing }: { isShowing: boolean }) {
  const { allowNsfw, updateNsfw } = useNsfw()

  return (
    <div aria-hidden={!isShowing} className={`absolute top-14 right-0 left-0 w-full shadow-md bg-zinc-50 dark:bg-zinc-800 z-10 transition-all duration-500 ${isShowing ? 'max-h-[calc(100vh-4rem)] max-h-[calc(100svh-4rem)] overflow-y-auto' : 'max-h-0 overflow-y-hidden'}`}>
      <div className="container mx-auto flex flex-col divide-y divide-zinc-400 dark:divide-zinc-700">
        <div className="mt-4 mx-4">
          <div className="flex gap-2 items-center">
            <h3 className="text-xl">
              Currency
            </h3>
            <div className="grow">
              <CurrencySelect standalone />
            </div>
            <Toggle checked={allowNsfw} textSize="sm" action={() => updateNsfw(!allowNsfw)}>Show NSFW images</Toggle>
          </div>
        </div>
        <div className="my-4 pt-4 pb-8">
          <h3 className="text-xl mx-4">
            Searched shops
          </h3>
          <SearchedShops fullWidth />
        </div>
      </div>
    </div>
  )
}
