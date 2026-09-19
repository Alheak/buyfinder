import cc from 'currency-codes'
import { useCurrency } from "../../store/CurrencyContext"
import LoadingSpinner from "../_utils/LoadingSpinner"

export default function CurrencySelect ({ className = '', fullWidth, standalone }: { className?: string, fullWidth?: boolean, standalone?: boolean }) {
  const { currency, currencyIsLoading, updateCurrency } = useCurrency()

  return (
    currencyIsLoading ? (
      <div className={`inline-block ${fullWidth ? 'w-full' : ''} ml-2 p-2 cursor-wait ${standalone ? 'rounded-lg shadow-md' : 'h-full'} text-center bg-zinc-50 dark:bg-zinc-700 ${className || ''}`}>
        <LoadingSpinner />
      </div>
    ) : (
      <select
        name="currency"
        id="CurrencySelect"
        className={`${fullWidth ? 'w-full' : ''} p-2 cursor-pointer ${standalone ? 'rounded-lg shadow-md' : 'h-full'} transition-colors bg-white dark:bg-zinc-700 hover:bg-slate-200 hover:dark:bg-gray-600 ${className || ''}`}
        onChange={(e) => updateCurrency(e.target.value)}
        value={currency}
      >
        {
          cc.codes().map((code) => (
            <option key={code} className="bg-white dark:bg-zinc-800" value={code}>{code}</option>
          ))
        }
      </select>
    )
  )
}
