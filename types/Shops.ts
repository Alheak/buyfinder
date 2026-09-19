
import type { CookieData, PuppeteerLifeCycleEvent } from 'rebrowser-puppeteer'

export type SearchLanguages = 'jp'

export type SearchTerm = 'jan' | 'char' | 'title' | 'manufacturer' | 'version' | 'origin' | 'classification' | 'scale' | 'distributor'

export interface ShopInfo {
  name: string
  url: string
  country: string
  currency: string
  isDomesticOnly?: boolean
  canShipTo?: string[]
  shippingWarning?: boolean
  bootlegWarning?: boolean
  exchangeRatesWarning?: boolean
  locationPriceWarning?: boolean
  accountWarning?: boolean
  inStockWishlistWarning?: boolean
  stockStatusWarning?: boolean
  nsfwBlock?: boolean
  isAccurate?: boolean
  siteIsBrokenNotice?: string
  affiliateAddParams?: [string, string][]
  affiliateUrlAppend?: string
  restockPotential?: boolean
  reportShopOnly?: boolean
  searchByJAN?: boolean
}

export interface Shop extends ShopInfo {
  useProxy?: boolean
  useCloudflare?: boolean
  showSignature?: boolean
  hideAgent?: boolean
  stealthy?: boolean
  onlyTerms?: ['category' | SearchTerm, RegExp][]
  skipTerms?: ['category' | SearchTerm, RegExp][]
  mirrorShop?: string
  useScript?: string
  hasAPI?: boolean
  isGraphQL?: boolean
  usesCredentials?: boolean
  usesCookies?: boolean
  cookiesExpiration?: number
  storageBearerTokenKey?: string
  loginURL?: string
  loginUsernameSelector?: string
  loginPasswordSelector?: string
  loginButtonSelector?: string
  preliminaryApiURL?: string
  apiURL?: string
  method?: 'GET' | 'POST' | 'OPTIONS'
  dataAsParams?: boolean
  preliminaryParams?: { [key: string]: any }
  params?: { [key: string]: any }
  responseType?: 'json' | 'html'
  headers?: { [key: string]: any }
  visitFirstUrl?: string
  visitFirstClickSelector?: string
  preliminarySearchParam?: string
  searchParam?: string
  searchParamsValueAppend?: string
  searchRoute?: string
  janSearchRoute?: string
  retryWithRoute?: string
  searchRouteAppend?: ['category' | SearchTerm, string, string][]
  defaultCategory?: string
  replaceParams?: ['category' | SearchTerm, string, string, any][]
  replaceCategory?: ['category' | SearchTerm, string, string][]
  decodeURI?: boolean
  searchTerms: (SearchTerm | '')[]
  searchTermsJoin?: string
  incognitoMode?: boolean
  retryIfError?: number
  retryForSelector?: string
  newPageBetweenSearches?: boolean
  clearCookiesBetweenSearches?: boolean
  waitBetweenSearches?: number
  addTerms?: ['category' | SearchTerm, string, string][]
  removeTerms?: ['category' | SearchTerm, string | boolean, 'category' | SearchTerm][]
  reverseCharName?: boolean
  isRegionLocked?: boolean
  notAvailableSelector?: string
  termsLang?: SearchLanguages
  normalizeSearch?: 'NFC' | 'NFD' | 'NFKC' | 'NFKD'
  navigate?: [string, ('category' | SearchTerm | string)?, boolean?][] // [{selector for search term input or click if no search term}, {search term to input}, {wait for navigation}]
  retryIfResults?: boolean
  retryIfNoResults?: boolean
  cookies?: CookieData[]
  localStorage?: { [key: string]: any }
  resultsSelector: string
  resultsSelectorForPreliminaryCall?: string
  subResultsSelector?: string
  alternateResultSelector?: string
  itemInfoSelector?: string
  resultsBeforeSelector?: [string, string | boolean]
  shadowRoots?: [string, string][]
  resultLimit?: number
  limitNonJANResults?: boolean
  resultCheckTerms?: [string, SearchTerm][]
  propertyToGetForMainAPICall?: string
  pageContentsClickSelector?: string
  titleSelector: string
  getTitleAttr?: boolean
  titleAttr?: string
  titleAttrRemove?: string
  isTitleSelectorGlobal?: boolean
  termsToCheck?: [SearchTerm, number | null][]
  checkTitleIfJan?: boolean
  checkUrlIfJan?: boolean
  checkPropertyIfJan?: string
  isJanPropertyGlobal?: boolean
  compareWithFigureName?: boolean
  stringSimilarity?: SearchTerm[]
  stringSimilarityPrepend?: [SearchTerm, boolean | string, string | null][]
  stringSimilarityAppend?: [SearchTerm, boolean | string, string | null][]
  stringSimilarityRemove?: [SearchTerm, boolean | string, SearchTerm][]
  stringSimilarityThreshold?: number
  imageSimilarity?: number
  inStockSelectors?: string[]
  soldOutSelectors?: string[]
  soldOutTextContent?: string[]
  isSoldOutSelectorGlobal?: boolean
  isInStockSelectorGlobal?: boolean
  linkSelector?: string | null
  linkSelectorGetItemCode?: [string, string, string]
  linkIsSelf?: boolean
  isLinkSelectorGlobal?: boolean
  itemIdRegex?: RegExp
  replaceUrl?: string
  cleanUrl?: RegExp
  urlRemoveParams?: string[]
  urlBuilder?: string
  urlReplace?: [string | RegExp, string][]
  stockAPIUrl?: string
  stockResultSelector?: string
  priceSelectors: string[]
  isPriceSelectorGlobal?: boolean
  priceIgnoreSelector?: string
  priceDivider?: [string, number]
  priceDividerExceptions?: ['category' | SearchTerm, RegExp, number][]
  includeHiddenPrice?: boolean
  priceTBDSelector?: [string?, string?]
  sellerSelector?: string
  isDomesticShippingOnlySelector?: [string, string?]
  buttonSelector?: string
  requiresClick?: boolean
  visitResults?: boolean
  visitResultsResultSelector?: string
  visitResultsPriceSelector?: string
  visitResultsInStockSelector?: string
  checkAPIResults?: string
  clickSelectors?: string[]
  alternateClickSelectors?: [string, string, boolean?][] // [selector to match, alternate selector, is search JAN]
  clickHidden?: boolean
  gotoHrefInsteadOfClick?: boolean
  waitUntil?: PuppeteerLifeCycleEvent
  timeout?: number | null
  waitForNavigation?: boolean
  waitForTimeout?: number
  actionTimeout?: number
  waitForSelector?: string
  abortIfSelector?: string
  retryIfSelector?: string
  ignoreIfSelector?: [string, any?]
  refreshSearchPage?: boolean
  itemCondition?: 'new' | 'used'
  itemConditionUsedSelectors?: [string, any?, boolean?][]
  itemConditionNewSelectors?: [string, any?, boolean?][]
  ignoreUsedIfMoreExpensive?: boolean
  ignoreNewIfLessExpensive?: boolean
  hasGarageKits?: boolean
  permanentListings: boolean | 'new' | 'used'
  checkResults?: boolean
  checkExistingListings?: boolean
  checkExistingListingsUrls?: boolean
  checkIfSoldOut?: boolean
  checkInStockSelectors?: [string, string?][]
  checkSoldOutSelectors?: [string, string?][]
  checkPriceSelectors?: string[]
  checkPriceIgnoreSelector?: string
  checkTerms?: [string, SearchTerm][]
  inverseFilter?: boolean
  usedListingsUrl?: string
  usedListingsResultSelector?: string
  usedListingCheckTerms?: [string, SearchTerm][]
  usedListingPriceSelector?: string
  checkForBootlegs?: boolean
  hasPreorders?: boolean
  noHitShop?: boolean
  stockResetTime?: string
  affiliateReplaceUrl?: [string, string]
  cachePageContent?: boolean
  watchCheckCacheTime?: number
}

export interface ShopsClient {
  [key: string]: ShopInfo
}

export interface Shops {
  [key: string]: Shop
}
