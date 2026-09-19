import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import CurrencySelect from "../Navbar/CurrencySelect"
import SearchedShops from "../Navbar/SearchedShops"
import Button from "../_utils/Button"
import Modal from "../_utils/Modal"
import SignIn from '../../components/Auth/SignIn'
import SignUp from '../../components/Auth/SignUp'
import WatchForm from '../../components/Figure/WatchForm'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCoins, faEdit, faEye, faEyeSlash, faPlus, faShop } from "@fortawesome/free-solid-svg-icons"
import { Watch, WatchData } from "../../types/Watch"
import { Figure } from "../../types/Figure"
import { useRouter } from "next/router"
import { useToast } from "../../store/ToastContext"
import ShopSuggestion from "./ShopSuggestion"

export default function Toolbar ({ figure, conditions, toggleCondition }: { figure: Figure, conditions: string[], toggleCondition: (condition: 'new' | 'used') => void }) {
  const { data: session, status } = useSession()
  const { updateToast } = useToast()
  const router = useRouter()
  const [modalElement, setModalElement] = useState<'signin' | 'signup' | 'form' | null>(null)
  const [watchIsLoading, setWatchIsLoading] = useState(false)
  const [showWatchModal, setShowWatchModal] = useState(false)
  const [showShopsModal, setShowShopsModal] = useState(false)
  const [showShopSuggestionModal, setShowShopSuggestionModal] = useState(false)
  const watchData: WatchData = figure.watch ?
    {
      figureId: figure._id.toString(),
      shopsToSearch: figure.watch.shopsToSearch,
      shopRules: figure.watch.shopRules,
      maximumPrice: figure.watch.maximumPrice,
      currency: figure.watch.currency,
      activeSearch: figure.watch.activeSearch,
      frequency: figure.watch.frequency
    } :
    {
      figureId: figure._id.toString()
    }

  async function toggleWatch () {
    if (!session) {
      setModalElement('signin')

      return
    }

    setModalElement(null)

    if (!figure.watch) {
      setModalElement('form')
    } else {
      try {
        setWatchIsLoading(true)

        const res = await fetch(`/api/watches/delete?figureId=${router.query._id}`)
        const watch = await res.json()

        figure.watch = watch

        setWatchIsLoading(false)
      } catch (error) {
        updateToast(`Something went wrong trying to ${figure.watch ? 'unwatch' : 'watch'} the figure.`, 'error')
      }
    }
  }

  function afterWatchCreated (watch: Watch) {
    setModalElement(null)

    figure.watch = watch
  }

  const ModalElement = () => {
    switch (modalElement) {
      case 'signin':
        return (
          <SignIn onSignIn={() => toggleWatch()} switchToSignUp={() => setModalElement('signup')} />
        )

      case 'signup':
        return (
          <SignUp onSignIn={() => toggleWatch()} switchToSignIn={() => setModalElement('signin')} />
        )

      case 'form':
        return (
          <WatchForm watchData={watchData} onSubmit={(watch) => afterWatchCreated(watch)} />
        )

      default:
        return (
          <div />
        )
    }
  }

  useEffect(() => setShowWatchModal(!!modalElement), [modalElement])

  return (
    <div className="relative flex flex-wrap items-center h-min mb-4 rounded-md shadow-md divide-x divide-zinc-300 dark:divide-zinc-600 bg-zinc-50 dark:bg-zinc-700">
      <div className="flex px-4 py-2">
        <input type="checkbox" name="condition-new" checked={conditions.includes('new')} onChange={() => toggleCondition('new')} />
        <label className="ml-2 cursor-pointer" htmlFor="condition-new" onClick={() => toggleCondition('new')}>
          <span>New</span>
        </label>
      </div>
      <div className="flex px-4 py-2">
        <input type="checkbox" name="condition-used" checked={conditions.includes('used')} onChange={() => toggleCondition('used')} />
        <label className="ml-2 cursor-pointer" htmlFor="condition-used" onClick={() => toggleCondition('used')}>
          <span>Used</span>
        </label>
      </div>
      <div className="grow-[10] py-5" />
      <div>
        <button
          className="w-max px-2 py-1 transition-colors text-black dark:text-white bg-zinc-50 dark:bg-zinc-700 hover:bg-zinc-100 hover:dark:bg-zinc-600"
          onClick={() => setShowShopsModal(true)}
        >
          <FontAwesomeIcon icon={faShop} />
          <span className="ml-2">Shops</span>
        </button>
        {
          !!session && (
            <button
              title="Suggest a shop"
              className="w-max mr-1 px-2 py-1 rounded-md shadow-md text-xs transition-colors text-white hover:text-black dark:text-white bg-cyan-800 hover:bg-white"
              onClick={() => setShowShopSuggestionModal(true)}
            >
              <FontAwesomeIcon icon={faPlus} />
              <span className="ml-1">Suggest</span>
            </button>
          )
        }
      </div>
      <div className="flex items-center pl-4 pr-2">
        <FontAwesomeIcon icon={faCoins} />
        <CurrencySelect />
      </div>
      {
        !!figure.watch ? (
          <div className="flex-grow flex float-right h-10">
            <Button
              title="Edit the watch"
              className="flex-grow rounded-l-md"
              icon={faEdit}
              isLoading={watchIsLoading || status === 'loading'}
              action={() => setModalElement('form')}
              integrate
            >
              Edit watch
            </Button>
            <Button
              title="Unwatch"
              className="rounded-r-md"
              icon={faEyeSlash}
              bgColor="bg-zinc-200"
              textColor="text-zinc-800"
              isLoading={watchIsLoading || status === 'loading'}
              action={() => toggleWatch()}
              integrate
            />
          </div>
        ) : (
          <Button
            className="flex-grow rounded-md float-right"
            icon={faEye}
            bgColor={figure.watch ? 'bg-zinc-200' : undefined}
            textColor={figure.watch ? 'text-zinc-800' : undefined}
            isLoading={watchIsLoading || status === 'loading'}
            action={() => toggleWatch()}
            integrate
          >
            Watch
          </Button>
        )
      }
      {
        showWatchModal && (
          <Modal title={modalElement === 'form' ? 'Customize the watch' : 'Sign in required'} onClose={() => setModalElement(null)}>
            <ModalElement />
          </Modal>
        )
      }
      {
        showShopsModal && (
          <Modal title="Searched shops" onClose={() => setShowShopsModal(false)}>
            <SearchedShops />
          </Modal>
        )
      }
      {
        showShopSuggestionModal && (
          <Modal title="Suggest a shop" onClose={() => setShowShopSuggestionModal(false)}>
            <ShopSuggestion close={() => setShowShopSuggestionModal(false)} />
          </Modal>
        )
      }
    </div>
  )
}
