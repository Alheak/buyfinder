import type { Figure } from './Figure'
import { Listing } from './Listing'
import { WatchOptions } from './Watch'

export type WorkerJob = {
  type: 'listings'
  shop: string
  figure: Figure
  urls?: string[]
  options?: WatchOptions
  priority?: number
  useCloud?: boolean
  status?: 'active' | 'delayed' | 'waiting'
  testMode?: boolean
}

export type ListingWorkerJob = {
  type: 'listing'
  shop: string
  listing: Listing
}

export type FigureWorkerJob = {
  type: 'figure'
  mfcLink: string
}

export type MfcLinkWorkerJob = {
  type: 'mfcLink'
  jan: string
}
