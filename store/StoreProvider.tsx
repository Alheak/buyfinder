import { CurrencyProvider } from '../store/CurrencyContext'
import { LoadingProvider } from '../store/LoadingContext'
import { ToastProvider } from '../store/ToastContext'
import { ShopsProvider } from "../store/ShopsContext"
import { ClickProvider } from './ClickContext'
import { NsfwProvider } from './NsfwContext'

export const StoreProvider = ({ children }: { children: React.ReactNode }) => (
  <ClickProvider>
    <NsfwProvider>
      <CurrencyProvider>
        <LoadingProvider>
          <ToastProvider>
            <ShopsProvider>
              {children}
            </ShopsProvider>
          </ToastProvider>
        </LoadingProvider>
      </CurrencyProvider>
    </NsfwProvider>
  </ClickProvider>
)
