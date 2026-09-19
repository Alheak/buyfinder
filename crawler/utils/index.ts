import * as cheerio from 'cheerio'
import Cloudflare from 'cloudflare'
import { AnyNode } from 'domhandler'
import axios, { AxiosRequestConfig } from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'
import puppeteer, { Browser, Page, LaunchOptions, Cookie } from 'rebrowser-puppeteer'
import { compareTwoStrings } from 'string-similarity'
import Origins from '../../api/models/Origin'
import Characters from '../../api/models/Character'
import Listings from '../../api/models/Listing'
import Prices from '../../api/models/Price'
import PricePoints from '../../api/models/PricePoint'
import Reports from '../../api/models/Report'
import { Figure, FigureData } from '../../types/Figure'
import { Character } from '../../types/Character'
import { SearchTerm, Shop, SearchLanguages } from '../../types/Shops'
import { jpRegex } from '../../mixins/jpRegex'
import { mfcLinkRegex } from '../../mixins/mfcLinkRegex'
import { Origin } from '../../types/Origin'
import getCurrency from '../../api/utils/getCurrency'
import getPriceValueFromString from '../../api/utils/getPriceValueFromString'
import connectDB from '../../api/utils/connectDB'
import { aliases } from '../../data/aliases'
import Figures from '../../api/models/Figure'
import { separate } from '../../data/separate'
import redis from '../../api/utils/redisClient'
import { FilterQuery } from 'mongoose'
import { shops } from '../../data/shops'
import { COMMON_CATEGORIES } from '../../data/commonCategories'
import { COMMON_CLASSIFICATIONS } from '../../data/commonClassifications'
import { COMMON_MANUFACTURERS } from '../../data/commonManufacturers'
import browserOptions from './browserOptions'
import { spawn } from 'child_process'
import { barcodeRegex } from '../../mixins/barcodeRegex'
import { COMMON_VERSIONS } from '../../data/commonVersions'

export interface UnparsedListing {
  id: string
  title: string
  price: string
  currency: string
  url: string
  condition: 'new' | 'used'
  seller?: string
  isDomesticShippingOnly: boolean
  isAccurate?: boolean
  searchUsed?: string
  priceIsTBD?: boolean
}

type SearchParam = { [key: string]: SearchParams | SearchParams[] | any }
type SearchParams = SearchParam | SearchParams[]

connectDB()

function separateTerm (term: SearchTerm, termValue: string, figure: Figure) {
  const termToSeparate = separate[term]

  if (!termToSeparate) return [termValue]

  const terms = []

  for (let k = 0; k < termToSeparate.length; k++) {
    const [regex, filter] = termToSeparate[k]

    for (const termToFilter in filter) {
      if (!filter[termToFilter].test(figure[termToFilter as SearchTerm] || '')) continue

      termValue = termValue.replaceAll(regex, (match: string, group: string) => {
        terms.push(group)

        return ''
      }).trim()
    }
  }

  terms.push(termValue)

  return terms
}

function hiraganaToKatakana(text: string) {
  return text.normalize('NFKC').replace(/[\u3041-\u3096]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) + 0x60)
  )
}

function cleanString (string: string) {
  return hiraganaToKatakana(string).toLowerCase().replaceAll(/[^\w\p{L}\u3099\u309A]/gu, '')
}

function substringIsPresentInReferences (substring: string | RegExp, references: string[]) {
  references = references.map(reference => cleanString(reference))

  return references.filter(reference => typeof substring === 'string' ? !reference.includes(substring) : !substring.test(reference)).length < references.length
}

const NORMALIZED_COMMON_CATEGORIES = COMMON_CATEGORIES.map(categories => categories.map(category => cleanString(category)))
const NORMALIZED_COMMON_CLASSIFICATIONS = COMMON_CLASSIFICATIONS.map(classifications => classifications.map(classification => cleanString(classification)))
const NORMALIZED_COMMON_MANUFACTURERS = COMMON_MANUFACTURERS.map(manufacturers => manufacturers.map(manufacturer => cleanString(manufacturer)))
const NORMALIZED_COMMON_VERSIONS = COMMON_VERSIONS.map(versions => versions.map(version => cleanString(version)))

export async function getProxyList () {
  const url = new URL('https://proxy.webshare.io/api/v2/proxy/list/')
        url.searchParams.append('mode', 'direct')
        url.searchParams.append('page_size', '20')
 
  const req = await fetch(url.href, {
    method: "GET",
    headers: {
      Authorization: `Token ${process.env.PROXY_TOKEN}`
    }
  })
 
  const res = await req.json()

  return res.results
}

export async function getProxyArgsForBrowser (shop: string, browserOptions: LaunchOptions, figure?: Figure) {
  const shopInfo = shops[shop]
  
  if (shopInfo.useProxy === undefined || shopInfo.useProxy === true) {
    const ownIpIsInUseRedisKey = `ownIp_${shop}`
    const ownIpIsInUse = !!(await redis.get(ownIpIsInUseRedisKey))

    if (ownIpIsInUse || shopInfo.useProxy) {
      // console.log('Using proxy searching', figure ? 'for figure' + figure._id.toString() : '', 'in shop', shop, '. Reason:', ownIpIsInUse ? 'own IP already in use' : 'shop requires proxy')

      if (!browserOptions.args) browserOptions.args = []

      browserOptions.args.push(`--proxy-server=http://${process.env.PROXY_SERVER || '0.0.0.0'}:${process.env.PROXY_PORT || '80'}`)
    } else {
      if (shop !== 'mfc') await redis.set(ownIpIsInUseRedisKey, '1', 'EX', 120)

      // console.log('Using own IP searching', figure ? 'for figure' + figure._id.toString() : '', 'in shop', shop)
    }
  }

  return browserOptions
}

export async function openBrowser (shop: string, figure?: Figure, currentBrowser?: Browser | null) {
  const prevArgsLength = browserOptions.args?.length || 0
  const updatedBrowserOptions = await getProxyArgsForBrowser(shop, browserOptions, figure)
  const updatedArgsLength = updatedBrowserOptions.args?.length || 0
  const isUsingProxy = prevArgsLength !== updatedArgsLength

  let browser: Browser | null = null
  let timeout: NodeJS.Timeout | null = null

  if (!isUsingProxy && !!currentBrowser) {
    browser = currentBrowser

    // console.log('Using current browser')
  } else {
    browser = await puppeteer.launch(updatedBrowserOptions)

    // console.log('Opening new browser')

    if (isUsingProxy) {
      timeout = setTimeout(async () => {
        try {
          await browser?.close()
        } catch (error) {
          console.error('Error when trying to close the browser instance', error)
        }
      }, 1000 * 60 * 2)
    }
  }

  if (!browser) throw new Error('No browser')

  return {
    isUsingOwnIp: !isUsingProxy,
    browser,
    timeout
  }
}

export async function cleanup (shop: string, isUsingOwnIp: boolean, page: Page | null, browser: Browser | null, timeout?: NodeJS.Timeout | null) {
  if (!!page) await redis.decr('localPageCount')

  if (timeout) clearTimeout(timeout)

  await browser?.close()

  // if (isUsingOwnIp) {
  //   await redis.del(`ownIp_${shop}`)

  //   await page?.close()

    // if (browser) {
    //   const pageCount = (await browser.pages()).length

    //   if (pageCount <= 1) {
    //     // console.log('No more pages, refreshing browser...')

    //     await browser.close()
    //   }
    // }
  // } else {
  //   await browser?.close()
  // }
}

export async function updatePrice ($: cheerio.CheerioAPI, listing: any, shop: Shop) {
  if (!shop.checkPriceSelectors || !shop.checkPriceSelectors.length) {
    // console.log('No selector to update the price of listing', listing)

    return listing
  }

  try {
    let newPriceString = ''

    for (let i = 0; i < shop.checkPriceSelectors?.length; i++) {
      const selector = shop.checkPriceSelectors[i]
      const priceElement = $(selector).get()[0]

      if (!priceElement) {
        // console.log('No price node found for selector', selector)

        continue
      }
  
      newPriceString = $(priceElement).text()
  
      if (shop.checkPriceIgnoreSelector) {
        const ignoreNodes = $(priceElement).find(shop.checkPriceIgnoreSelector).get()
  
        for (let j = 0; j < ignoreNodes.length; j++) {
          const ignoreEl = $(ignoreNodes[j])
          
          if (ignoreEl.text()) newPriceString = newPriceString.replace(ignoreEl.text(), '')
        }
      }

      newPriceString = newPriceString.trim()
  
      if (!!newPriceString) break

      // console.log('No price found for selector', selector)
    }

    const newPrice = getPriceValueFromString(newPriceString)
    const currency = getCurrency(newPriceString, listing.currency)

    if (!listing._id) {
      listing.price = newPrice
      listing.currency = currency

      return listing
    }

    const listingInstance = await Listings.findById(listing._id)

    if (!listingInstance) {
      // console.log('Couldn\'t find any database entry for listing', listing)

      return null
    }

    listingInstance.price = newPrice
    listingInstance.currency = currency

    await listingInstance.save()

    if (!listingInstance.priceIsTBD) {
      await Prices.create({ listing: listing._id, price: newPrice, currency })
  
      const nowDate = new Date()
      const nowYear = nowDate.getUTCFullYear()
      const nowMonth = nowDate.getUTCMonth()
  
      await PricePoints.deleteMany({
        figure: listing.figure,
        yearMonth: `${nowYear}/${nowMonth}`
      })
    }

    return listingInstance
  } catch (error) {
    console.error('Couldn\'t update the price for listing', listing._id.toString())
  }

  return listing
}

export function getAPIOptions (url: string, shop: Shop, shopCookies?: Cookie[], bearerToken?: string) {
  const options: AxiosRequestConfig = {
    url,
    maxBodyLength: Infinity,
    method: shop.method || 'GET'
  }

  if (shop.timeout !== null) options.timeout = shop.timeout || 1000 * 15
  if (shop.headers) options.headers = shop.headers
  if (shop.usesCredentials) options.withCredentials = true
  if (shop.cookies || shopCookies) {
    const cookies = [...(shopCookies || []), ...(shop.cookies || [])]

    if (cookies.length) {
      options.headers = {
        ...shop.headers,
        'Cookie': cookies.map(cookie => `${cookie.name}=${cookie.value};`).join(' ')
      }
    }
  }
  if (bearerToken) {
    options.headers = {
      ...shop.headers,
      'Authorization': bearerToken
    }
  }

  if (shop.useProxy) {
    const httpsAgent = new HttpsProxyAgent(`http://${process.env.PROXY_SERVER || '0.0.0.0'}:${process.env.PROXY_PORT || '80'}`)

    options.httpsAgent = httpsAgent
  }

  return options
}

function selectorHandler (selector: string, item: any) {
  if (typeof item !== 'object' && !Array.isArray(item)) return item

  return selector.split('.').reduce((currItem, subSelector) => {
    if (typeof currItem !== 'object' && !Array.isArray(currItem)) return currItem

    let key: string | number = subSelector

    const keyIndex = parseInt(key)

    if (!isNaN(keyIndex)) key = keyIndex

    const value: { [key: string]: any } | any[] = typeof key === 'number' ? currItem.at(key) : (currItem as { [key: string]: any })[key]

    return value
  }, item)
}

export async function getPageContentFromCloudflare(url: string, shop: Shop) {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN || ''
  const account_id = process.env.CLOUDFLARE_ACCOUNT_ID || ''

  const client = new Cloudflare({ apiToken })
  const content = await client.browserRendering.content.create({
    account_id,
    url,
    gotoOptions: {
      waitUntil: shop.waitUntil,
      timeout: shop.timeout || undefined
    },
    waitForSelector: shop.waitForSelector ? {
      selector: shop.waitForSelector
    } : undefined,
    waitForTimeout: shop.waitForTimeout,
    actionTimeout: shop.actionTimeout,
    cookies: shop.cookies?.map(cookie => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path
    })),
    rejectResourceTypes: ["image", "media", "font", "stylesheet"],
    rejectRequestPattern: ["/^.*\\.(css)"]
  })
  const pageContents = [content]

  // console.log('Page content from Cloudflare:', content)

  return pageContents
}

export async function getAPIResults (shop: Shop, figure: Figure, search: string, retry?: boolean, shopCookies?: Cookie[], bearerToken?: string) {
  const url = retry && shop.retryWithRoute ? (shop.url + shop.retryWithRoute) : (shop.apiURL || (shop.url + shop.searchRoute))

  // if (retry) // console.log('Retrying API fetch for figure', figure._id.toString(), 'in', shop.name, 'with url', url)

  let searchResults: UnparsedListing[] = []

  const searchIsJan = barcodeRegex.test(search)
  const options = getAPIOptions(url, shop, shopCookies, bearerToken)

  const dataOrParams = shop.method === 'POST' && !shop.dataAsParams ? 'data' : 'params'
  const setSearchParam = (searchParams: SearchParams, keysTree: string[], value: any): SearchParams => {
    let currKey: string | number | undefined = keysTree[0]

    if (currKey === undefined) return { ...searchParams, search: value }

    const currKeyIndex = parseInt(currKey)

    if (!isNaN(currKeyIndex)) currKey = currKeyIndex

    let nextKey: string | number | undefined = keysTree[1]

    const nextKeyIndex = parseInt(nextKey)

    if (!isNaN(nextKeyIndex)) nextKey = nextKeyIndex

    let currValue = value

    if (nextKey !== undefined) {
      const nextEmptyObject = (typeof nextKey === 'number' ? [] : {})
      const nextSearchParams: SearchParams = typeof currKey === 'number' ? 
        (
          searchParams.at(currKey) || nextEmptyObject
        ) :
        (
          (searchParams as SearchParam)[currKey] || nextEmptyObject
        )

      currValue = setSearchParam(nextSearchParams, keysTree.slice(1), value)
    }
    
    const currSearchParam: SearchParams = typeof currKey === 'number' ?
      [...searchParams.slice(0, currKey), currValue, ...searchParams.slice(currKey + 1)] :
      { ...searchParams, [currKey]: currValue }

    return currSearchParam
  }

  let dataForMainCall: string[] | undefined = undefined

  if (shop.preliminaryApiURL) {
    const preliminaryOptions = { ...options }

    preliminaryOptions.url = shop.preliminaryApiURL

    if (shop.preliminarySearchParam) {
      const searchParamTree = shop.preliminarySearchParam?.split('.') || []
    
      preliminaryOptions[dataOrParams] = setSearchParam(shop.preliminaryParams || {}, searchParamTree, search)
    } else {
      if (shop.preliminaryParams) preliminaryOptions[dataOrParams] = shop.preliminaryParams
      if (preliminaryOptions.url) preliminaryOptions.url = preliminaryOptions.url.replace('{search}', search)
    }
  
    if ((!searchIsJan || shop.checkTitleIfJan) && shop.replaceParams) {
      for (let j = 0; j < shop.replaceParams.length; j++) {
        const [term, equalsTo, param, value] = shop.replaceParams[j]
        const searchParamTree = param.split('.') || []
  
        if (figure[term] === equalsTo) preliminaryOptions[dataOrParams] = setSearchParam(preliminaryOptions[dataOrParams] || {}, searchParamTree, value)
      }
    }

    try {
      while (await redis.exists(`retry-after_${shop.url}`)) {
        // console.log(`Shop ${shop.name} blocks too many requests, waiting...`)

        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      const res = await axios.request(preliminaryOptions)
      const data = res.data
  
      // console.log('Got res from API for', figure._id.toString(), 'in', shop.name, ':', res)
  
      if (!data) return []

      const parsedData: { [key: string]: any } | any[] = (typeof data === 'string' ? JSON.parse(data) : data)
      // const preliminaryResults = (shop.resultsSelectorForPreliminaryCall || shop.resultsSelector).split('.').reduce((item, resultsSelectorForPreliminaryCall) => {
      //   let key: string | number = resultsSelectorForPreliminaryCall

      //   const keyIndex = parseInt(key)

      //   if (!isNaN(keyIndex)) key = keyIndex

      //   const value: { [key: string]: any } | any[] = typeof key === 'number' ? item.at(key) : (item as { [key: string]: any })[key]

      //   return value
      // }, parsedData) as any[]
      const preliminaryResults = selectorHandler(shop.resultsSelectorForPreliminaryCall || shop.resultsSelector, parsedData) as any[]

      if (!!shop.propertyToGetForMainAPICall) {
        dataForMainCall = preliminaryResults.map(result => (shop.searchParamsValueAppend || '') + result[shop.propertyToGetForMainAPICall as string])
      }
    } catch (error) {
      console.error('Couldn\'t fetch preliminary results from API for', shop.name, 'at URL', shop.preliminaryApiURL, ':', error)
  
      throw new Error('Error trying to fetch preliminary results from API')
    }
  }

  if (shop.searchParam) {
    const searchParamTree = shop.searchParam?.split('.') || []
  
    options[dataOrParams] = setSearchParam(shop.params || {}, searchParamTree, dataForMainCall || search)
  } else {
    if (shop.params) options[dataOrParams] = shop.params
    if (options.url) options.url = options.url.replace('{search}', search)
  }

  if ((!searchIsJan || shop.checkTitleIfJan) && shop.replaceParams) {
    for (let j = 0; j < shop.replaceParams.length; j++) {
      const [term, equalsTo, param, value] = shop.replaceParams[j]
      const searchParamTree = param.split('.') || []

      if (figure[term] === equalsTo) options[dataOrParams] = setSearchParam(options[dataOrParams] || {}, searchParamTree, value)
    }
  }

  // console.log('Fetching results from API for', figure._id.toString(), 'in', shop.name, 'with options', options)

  try {
    while (await redis.exists(`retry-after_${shop.url}`)) {
      // console.log(`Shop ${shop.name} blocks too many requests, waiting...`)

      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const res = await axios.request(options)
    const data = res.data

    // console.log('Got res from API for', figure._id.toString(), 'in', shop.name, ':', res)

    if (!data) return []

    if (shop.ignoreIfSelector) {
      const [selector, value] = shop.ignoreIfSelector

      if (value === undefined && Object.keys(data).includes(selector)) return []

      if (data[selector] === value) return []
    }

    let items: any[] = []
    
    if (shop.responseType === 'html') {
      const pageContents = [data]
      const resultLimit = (shop.limitNonJANResults && !barcodeRegex.test(search)) || !shop.limitNonJANResults ? shop.resultLimit : undefined

      searchResults = pageContents.flatMap(pageContent => (getResults(pageContent, shop, options.url || '', figure) || []).slice(0, resultLimit))
    } else {
      const parsedData: { [key: string]: any } | any[] = (typeof data === 'string' ? JSON.parse(data) : data)

      // items = shop.resultsSelector.split('.').reduce((item, resultsSelector) => {
      //   let key: string | number = resultsSelector

      //   const keyIndex = parseInt(key)

      //   if (!isNaN(keyIndex)) key = keyIndex

      //   const value: { [key: string]: any } | any[] = typeof key === 'number' ? item.at(key) : (item as { [key: string]: any })[key]

      //   return value
      // }, parsedData) as any[]
      items = selectorHandler(shop.resultsSelector, parsedData)

      // console.log('Got results from API for', figure._id.toString(), 'in', shop.name, ':', items)

      if (!items.length) return []

      searchResults = await parseAPIResults(shop, items, figure, shopCookies, bearerToken)
    }
  } catch (error: any) {
    const retryAfter = error.response.headers['retry-after']

    if (retryAfter) await redis.set(`retry-after_${shop.url}`, '', 'EX', retryAfter)

    console.error('Couldn\'t fetch results from API for', shop.name, 'at URL', options.url, ':', error)

    throw new Error('Error trying to fetch results from API')
  }

  return searchResults
}

export async function parseAPIResults (shop: Shop, items: any[], figure?: Figure, shopCookies?: Cookie[], bearerToken?: string) {
  const results = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    let subItems: any[] = [item]

    if (shop.subResultsSelector) {
      // subItems = shop.subResultsSelector.split('.').reduce((subItem, resultsSelector) => {
      //   let key: string | number = resultsSelector

      //   const keyIndex = parseInt(key)

      //   if (!isNaN(keyIndex)) key = keyIndex

      //   const value: { [key: string]: any } | any[] = typeof key === 'number' ? subItem.at(key) : (subItem as { [key: string]: any })[key]

      //   return value
      // }, item) as any[]
      subItems = selectorHandler(shop.subResultsSelector, item)
    }

    let ignoreUsed = false

    subItems = subItems.filter(subItem => {
      if (shop.itemInfoSelector && subItem[shop.itemInfoSelector]) subItem = subItem[shop.itemInfoSelector]

      const jans = figure?.releases.filter(release => !!release.jan).map(release => release.jan) || []
      const itemJAN = subItem[shop.checkPropertyIfJan || '']  || ''
      const doesNotContainCorrectJAN = jans.length &&
        itemJAN &&
        !jans.includes(itemJAN)

      if (doesNotContainCorrectJAN) {
        // console.log('Item in', shop.name, 'with JAN', itemJAN, 'does not appear in JANs', jans, ', filtering out.')

        return false
      }

      if (shop.inStockSelectors) {
        const inStockItem = shop.isInStockSelectorGlobal ? item : subItem
        const inStockSelector = shop.inStockSelectors.find(selector => Object.keys(inStockItem).includes(selector))

        if (!inStockSelector) {
          // console.log('Item in', shop.name, 'for figure', figure?._id.toString(), 'doesn\'t seem to be in stock', inStockSelector, ', filtering out.')

          return false
        }

        if (!!inStockItem[inStockSelector] === false && shop.name === 'Solaris Japan' && ['Brand New', 'Early Bird'].includes(inStockItem.title) && inStockItem.price.amount !== '0.0') {
          ignoreUsed = true
        }
          
        return !!inStockItem[inStockSelector]
      }

      if (shop.soldOutSelectors) {
        const soldOutItem = shop.isSoldOutSelectorGlobal ? item : subItem
        const soldOutSelector = shop.soldOutSelectors.find(selector => Object.keys(soldOutItem).includes(selector))

        if (!soldOutSelector) return true

        if (shop.soldOutTextContent) return !shop.soldOutTextContent.find(soldOutTextContent => (soldOutItem[soldOutSelector] || '').includes(soldOutTextContent))

        return !soldOutItem[soldOutSelector]
      }

      return true
    })

    const tempResults: UnparsedListing[] = subItems.map((subItem: any) => {
      if (shop.itemInfoSelector && subItem[shop.itemInfoSelector]) subItem = subItem[shop.itemInfoSelector]

      const titleItem = shop.isTitleSelectorGlobal ? item : subItem
      const title = shop.titleSelector ? `${(titleItem)[shop.titleSelector]}` : ''

      const priceItem = shop.isPriceSelectorGlobal ? item : subItem

      let price = ''
      
      for (let j = 0; j < shop.priceSelectors.length; j++) {
        const priceSelector = shop.priceSelectors[j]
        // const priceValue = priceSelector.split('.').reduce((item, subSelector) => {
        //   let key: string | number = subSelector

        //   const keyIndex = parseInt(key)

        //   if (!isNaN(keyIndex)) key = keyIndex

        //   const value: { [key: string]: any } | any[] = typeof key === 'number' ? item.at(key) : (item as { [key: string]: any })[key]

        //   return value
        // }, priceItem)
        const priceValue = selectorHandler(priceSelector, priceItem)

        if ((!!priceValue || priceValue === 0) && (typeof priceValue === 'string' || typeof priceValue === 'number')) {
          price = `${priceValue}`

          break
        }
      }

      // const price = priceSelector ? `${(priceItem)[priceSelector]}` : ''

      const linkItem = shop.isLinkSelectorGlobal ? item : subItem

      let resultUrl = ''

      if (!!shop.urlBuilder) {
        resultUrl = shop.urlBuilder.replaceAll(/\{(\w+(?:\.\w+)?)\}/g, (match, selector) => selectorHandler(selector, linkItem))
      } else if (!!shop.linkSelector) {
        // resultUrl = shop.linkSelector ? linkItem[shop.linkSelector] : ''
        resultUrl = selectorHandler(shop.linkSelector, linkItem)
      }

      if (shop.replaceUrl) {
        let id = resultUrl

        if (shop.itemIdRegex) id = (shop.itemIdRegex.exec(resultUrl) || [])[1]
        if (id !== null) resultUrl = shop.replaceUrl + id
      }
      
      if (!/http(s)?/.test(resultUrl)) {
        resultUrl = shop.url + (/^\//.test(resultUrl) ? '' : '/') + resultUrl
      }

      if (shop.urlRemoveParams) {
        const resultUrlAsURL = new URL(resultUrl)

        for (let j = 0; j < shop.urlRemoveParams.length; j++) {
          const paramToRemove = shop.urlRemoveParams[j]
          
          resultUrlAsURL.searchParams.delete(paramToRemove)
        }

        resultUrl = resultUrlAsURL.toString()
      }

      if (shop.urlReplace) {
        for (let j = 0; j < shop.urlReplace.length; j++) {
          const [searchValue, replaceValue] = shop.urlReplace[j]
          
          resultUrl = resultUrl.replaceAll(searchValue, replaceValue)
        }
      }

      let condition = shop.itemCondition || 'new'

      if (shop.itemConditionUsedSelectors) {
        const [conditionSelector, valueToMatch] = shop.itemConditionUsedSelectors.find(([selector]) => !!subItem[selector] !== undefined) || []

        if (conditionSelector !== undefined && valueToMatch !== undefined) {
          const tempCondition = subItem[conditionSelector]

          if (tempCondition !== undefined) {
            condition = tempCondition === valueToMatch ? 'used' : condition
          }
        }
      } else if (shop.itemConditionNewSelectors) {
        const [conditionSelector, valueToMatch] = shop.itemConditionNewSelectors.find(([selector]) => !!subItem[selector] !== undefined) || []

        if (conditionSelector !== undefined && valueToMatch !== undefined) {
          const tempCondition = subItem[conditionSelector]

          if (tempCondition !== undefined) {
            condition = tempCondition === valueToMatch ? 'new' : condition
          }
        }
      }

      let isDomesticShippingOnly = !!shop.isDomesticOnly

      if (shop.isDomesticShippingOnlySelector) {
        const tempDomesticShipping = subItem[shop.isDomesticShippingOnlySelector[0]]

        if (shop.isDomesticShippingOnlySelector[1] && typeof tempDomesticShipping === 'string') {
          isDomesticShippingOnly = tempDomesticShipping.includes(shop.isDomesticShippingOnlySelector[1])
        }
      }
      
      return {
        id: shop.name,
        title,
        price,
        currency: shop.currency,
        url: resultUrl,
        condition,
        isDomesticShippingOnly
      }
    })
    .filter(result => result.condition !== 'used' || !ignoreUsed)

    let subResults: UnparsedListing[] = []

    if (shop.checkAPIResults) {
      for (let j = 0; j < tempResults.length; j++) {
        const tempResult = tempResults[j]
        const options = getAPIOptions(tempResult.url + '.js', shop, shopCookies, bearerToken)
        const res = await axios(options)
        const data = res.data

        if (!!data[shop.checkAPIResults]) subResults.push(tempResult)
      }
    } else {
      subResults = tempResults
    }

    subResults = subResults.slice(0, shop.resultLimit)

    results.push(subResults)
  }

  return results.flatMap(result => result)
}

export async function getResultsFromScript (filename: string, search: string) {
  const scriptDataRedisKey = `script_data_${filename}_${search}`

  let data = await redis.get(scriptDataRedisKey)

  if (!data) {
    const path = `./scripts/${filename}`

    try {
      // console.log(`Fetching results for search ${search} with script ${path}`)
  
      data = await new Promise<string>((resolve, reject) => {
        const process = spawn('python', [path, search])
  
        let partialData = ''
        let error = ''
    
        process.stdout.on('data', (chunk) => {
          partialData += chunk.toString()
        })
    
        process.stderr.on('error', (chunk) => {
          error += chunk.toString()
        })
    
        process.on('close', (code) => {
          if (code !== 0 || error) return reject(new Error(`Python script exited with code ${code}\nError: ${error}`))
  
          try {
            resolve(partialData)
          } catch (error: any) {
            reject(new Error(`Failed to parse JSON: ${error.message}`))
          }
        })
      })
  
      if (data) await redis.set(scriptDataRedisKey, data, 'EX', 60 * 10)
    } catch (error) {
      console.error('Error when getting results of search', search, 'from script', path, ':', error)
    }
  }

  // console.log('Data found with script:', data)

  return JSON.parse(data || '{}')
}

export async function getMfcListings (page: Page, figure: Figure, shop: Shop): Promise<UnparsedListing[]> {
  const itemId = (mfcLinkRegex.exec(figure.mfcLink || '') || [])[1]
  const listingsUrl = `${shop.url}${itemId}`

  let gotoRetries = 0

  do {
    try {
      await page.goto(listingsUrl, { waitUntil: 'domcontentloaded' })

      break
    } catch (error) {
      console.error('Error trying to get MFC listings at', listingsUrl, ':', error)

      gotoRetries++
    }
  } while (gotoRetries < 3)

  if (gotoRetries >= 3) throw new Error(`Too many attempts trying to go to ${listingsUrl}`)

  try {
    await page.waitForSelector(shop.resultsSelector, { timeout: 2000 })
  } catch (error) {
    return []
  }

  const pageContent = await page.content()
  const $ = cheerio.load(pageContent)

  return $(shop.resultsSelector).get().map(node => {
    const title = $(node).find(shop.titleSelector).text()
    const price = $(node).find(shop.priceSelectors[0]).text()
    const currency = getCurrency(price)
    const url = 'https://myfigurecollection.net' + ($(node).find(shop.linkSelector || '').attr('href') || '')

    return {
      id: shop.name,
      title,
      price,
      currency,
      url,
      condition: 'used',
      isDomesticShippingOnly: false
    }
  })
}

export async function getPageContentFromCloud (searchUrl: string, shop: Shop, figure: Figure, search?: string) {
  const res = await axios({
    method: 'post',
    url: 'https://us-central1-figure-price-checker.cloudfunctions.net/getUSListings',
    timeout: 1000 * 60,
    data: {
      url: searchUrl,
      shop,
      figure,
      search
    },
    headers: {
      'firebase-functions-token': process.env.FIREBASE_FUNCTIONS_TOKEN
    }
  })

  if (!!res && res.statusText === 'OK') {
    return res.data
  } else {
    throw new Error(
      res
        ? `Error ${res.status} when trying to get page content from cloud: ${res.statusText}.`
        : 'Couldn\'t get any response when trying to get page content from cloud.'
    )
  }
}

async function getCharNames (character: Character, shop: Shop) {
  const charNames: string[] = []
  const charName = (shop.termsLang === 'jp' ? character.originalName : character.name) || ''
  const charAliases = aliases.char

  let isReplacedByAlias = false

  for (let i = 0; i < charAliases.length; i++) {
    const [aliasRegex, termToAdd, replace] = charAliases[i]
    
    if (aliasRegex.test(charName)) {
      replace ? charNames[0] = termToAdd : charNames.push(termToAdd)

      isReplacedByAlias = !!replace

      break
    }
  }

  if (isReplacedByAlias) return charNames

  if (charName) {
    charNames.push(charName)

    if (shop.reverseCharName) {
      const reversedName = charName.split(/\s/).reverse().join(' ')

      if (reversedName !== charName) charNames.push(reversedName)
    }
  }



  if (character.altNames && character.altNames.length) {
    const altNames = character.altNames.filter(altName => shop.termsLang === 'jp' ? jpRegex.test(altName) : !jpRegex.test(altName))

    altNames.filter(altName => /[0-9\p{Script=Latin}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]+/u.test(altName)).forEach(altName => {
      charNames.push(altName)

      if (shop.reverseCharName) {
        const reversedAltName = altName.split(/\s/).reverse().join(' ')

        if (reversedAltName !== altName) charNames.push(reversedAltName)
      }
    })
  }

  return charNames
}

export async function getSearches (termsData: FigureData, searchTerms: (SearchTerm | '')[], figure: Figure, shop: Shop, withJan: boolean = false) {
  let searches: string[] = []

  if (withJan && shop.searchTerms?.includes('jan')) {
    const jans = new Set(figure.releases.filter(release => release.jan).map(release => release.jan) as string[])

    searches = Array.from(jans)
  }

  const terms: string[][] = []

  for (let i = 0; i < searchTerms.length; i++) {
    const searchTerm = searchTerms[i]

    if (shop.removeTerms) {
      const isTermToRemove = shop.removeTerms.filter(([term, equalsTo, termToRemove]) => (typeof equalsTo === 'string' ? figure[term] === equalsTo : !!figure[term]) && searchTerm === termToRemove)
      
      if (isTermToRemove && isTermToRemove.length) continue
    }

    const termsToAdd = []
    const termAliases = aliases[searchTerm] || []

    switch (searchTerm) {
      case '':
        terms.push([''])
        break

      case 'origin':
        if (!figure.origin) break

        const originName = termsData.origin || figure.origin

        if (!originName) break

        let originNames = [originName]

        let isReplacedByAlias = false

        for (let j = 0; j < termAliases.length; j++) {
          const [aliasRegex, termToAdd, replace] = termAliases[j]
          
          if (aliasRegex.test(originName)) {
            replace ? originNames[0] = termToAdd : originNames.push(termToAdd)

            isReplacedByAlias = !!replace
          }
        }

        if (!isReplacedByAlias) {
          const origin: Origin | null = await Origins.findOne({ name: figure.origin })
  
          if (origin && origin.altNames && origin.altNames.length) {
            const altNames = origin.altNames.filter(altName => !altName || (shop.termsLang === 'jp' ? jpRegex.test(altName) : !jpRegex.test(altName)))
  
            altNames.filter(altName => !altName || !!altName.trim()).forEach(altName => {
              originNames = originNames.filter(name => !name.toLowerCase().includes(altName.toLowerCase()))
  
              originNames.push(altName)
            })
          }
        }

        terms.push(originNames)

        break

      case 'char':
        if (!figure.char) break

        const char = (termsData.char || figure.char)

        if (!char) break

        if (!figure.chars || !figure.chars.length) {
          terms.push([char])

          break
        }

        for (let j = 0; j < figure.chars.length; j++) {
          const charId = figure.chars[j]
          const character: Character | null = await Characters.findById(charId)

          if (!character) continue

          const charNames = await getCharNames(character, shop)

          if (!charNames.length) charNames.push(char)
        
          if (figure.chars.length > 1) charNames.push('')
          
          terms.push(charNames)
        }

        break

      case 'classification':
        const classification = termsData.classification || figure.classification

        if (!classification) break

        termsToAdd.push(classification)
  
        for (let k = 0; k < termAliases.length; k++) {
          const [aliasRegex, termToAdd, replace] = termAliases[k]
          
          if (aliasRegex.test(classification)) {
            replace ? termsToAdd[termsToAdd.length - 1] = termToAdd : termsToAdd.push(termToAdd)

            break
          }
        }

        break

      case 'manufacturer':
        const sculptor = termsData.sculptor || figure.sculptor

        if (!!sculptor && (figure.category === 'Garage Kits' || figure.classification === 'Doujin Figure')) {
          termsToAdd.push(sculptor)
  
          for (let k = 0; k < termAliases.length; k++) {
            const [aliasRegex, termToAdd, replace] = termAliases[k]
            
            if (aliasRegex.test(sculptor)) {
              replace ? termsToAdd[termsToAdd.length - 1] = termToAdd : termsToAdd.push(termToAdd)

              if (replace) break
            }
          }
        }

        const distributor = termsData.distributor || figure.distributor

        if (distributor) {
          termsToAdd.push(distributor)
  
          for (let k = 0; k < termAliases.length; k++) {
            const [aliasRegex, termToAdd, replace] = termAliases[k]
            
            if (aliasRegex.test(distributor)) {
              replace ? termsToAdd[termsToAdd.length - 1] = termToAdd : termsToAdd.push(termToAdd)

              if (replace) break
            }
          }
        }

        const manufacturer = termsData.manufacturer || figure.manufacturer

        if (manufacturer) {
          termsToAdd.push(manufacturer)

          for (let k = 0; k < termAliases.length; k++) {
            const [aliasRegex, termToAdd, replace] = termAliases[k]
            
            if (aliasRegex.test(manufacturer)) {
              replace ? termsToAdd[termsToAdd.length - 1] = termToAdd : termsToAdd.push(termToAdd)

              if (replace) break
            }
          }
        }

        break

      case 'version':
        let version = (termsData.version || figure.version)

        if (!version) break

        if (shop.termsLang === 'jp') version = version.replaceAll(/[^\s\w\p{L}\u3099\u309A]/gu, '').replaceAll(/[^\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]+$/g, '') || version

        termsToAdd.push(version)

        const versionRegex = /\sver(sion|\.)/i

        if (versionRegex.test(version)) {
          const lightVersion = version?.replace(versionRegex, '')

          termsToAdd.push(lightVersion)
        }

        for (let k = 0; k < termAliases.length; k++) {
          const [aliasRegex, termToAdd, replace] = termAliases[k]
          
          if (aliasRegex.test(version))  {
            replace ? termsToAdd[termsToAdd.length - 1] = termToAdd : termsToAdd.push(termToAdd)

            if (replace) break
          }
        }

        break
    
      default:
        if (!searchTerm) break

        let termValue = (['char', 'manufacturer', 'title', 'version', 'origin', 'classification'].includes(searchTerm) ? termsData[searchTerm as keyof FigureData] : figure[searchTerm]) || ''

        if (!termValue) break

        termsToAdd.push(termValue)

        for (let k = 0; k < termAliases.length; k++) {
          const [aliasRegex, termToAdd, replace] = termAliases[k]
          
          if (aliasRegex.test(termValue)) {
            replace ? termsToAdd[termsToAdd.length - 1] = termToAdd : termsToAdd.push(termToAdd)

            if (replace) break
          }
        }
    }

    if (termsToAdd.length) terms.push(termsToAdd)
  }

  if (shop.addTerms) {
    for (let i = 0; i < shop.addTerms.length; i++) {
      const [term, equalsTo, value] = shop.addTerms[i]
      
      if (figure[term] === equalsTo) terms.push([value])
    }
  }

  const helper = (currentIndex: number, currentStr: string) => {
    if (currentIndex === terms.length) {
      searches.push(currentStr.trim())

      return
    }

    for (let i = 0; i < terms[currentIndex].length; i++) {
      const termToAdd = terms[currentIndex][i]
      const termNotAlreadyPresent = termToAdd && !currentStr.includes(termToAdd)
      const append = termNotAlreadyPresent ? (' ' + termToAdd) : ''
      const newStr = currentStr + append

      helper(currentIndex + 1, newStr)
    }
  }

  helper(0, '')

  return searches.map(search => search
    .replaceAll(/(_|[^\w\p{L}\u3099\u309A])/gu, ' ')
    .normalize(shop.normalizeSearch || 'NFKC')
    .trim()
  )
}

async function termIsContainedInTitle (termsToCheck: [SearchTerm, number | null][], lang: 'en' | 'jp', figure: Figure, title: string) {
  const lowerCaseTitle = cleanString(title)
  const termsData = lang !== 'en' && figure[lang] ? figure[lang] : figure
  
  for (let i = 0; i < termsToCheck.length; i++) {
    const [termToCheck, index] = termsToCheck[i]
    const terms: string[] = []
    const charIsTitle = figure.char === figure.title
    const term = termToCheck === 'char' && charIsTitle ? 'title' : termToCheck
    const termAliases = aliases[term] || []

    switch (term) {
      case 'origin':
        if (!termsData.origin) break

        let isReplacedByAlias = false

        for (let k = 0; k < termAliases.length; k++) {
          const [aliasRegex, termToAdd, replace] = termAliases[k]
          
          if (aliasRegex.test(hiraganaToKatakana(termsData.origin))) {
            terms.push(termToAdd)

            isReplacedByAlias = !!replace
          }
        }

        if (isReplacedByAlias) break

        const origin: Origin | null = await Origins.findOne({ name: figure.origin })

        if (!origin) break

        let originName = termsData.origin

        separateTerm('origin', originName, figure).forEach(termValue => terms.push(termValue))

        if (origin.altNames && origin.altNames.length) {
          const altNames = origin.altNames.filter(altName => lang === 'jp' ? jpRegex.test(altName) : !jpRegex.test(altName))

          altNames.filter(altName => !!altName.trim()).forEach(altName => terms.push(altName))
        }

        break

      case 'char':
        if (!figure.char) break

        const char = (termsData.char || figure.char)

        if (!figure.chars || !figure.chars.length) {
          terms.push(char)

          for (let j = 0; j < termAliases.length; j++) {
            const [aliasRegex, termToAdd] = termAliases[j]
            
            if (aliasRegex.test(hiraganaToKatakana(char))) {
              terms.push(termToAdd)
  
              break
            }
          }

          break
        }

        for (let j = 0; j < figure.chars.length; j++) {
          const charId = figure.chars[j]
          const character: Character | null = await Characters.findById(charId)

          if (!character) continue

          const charName = (lang === 'jp' ? (character.originalName || char) : character.name) || ''

          if (charName) {
            for (let k = 0; k < termAliases.length; k++) {
              const [aliasRegex, termToAdd] = termAliases[k]
              
              if (aliasRegex.test(hiraganaToKatakana(charName))) {
                terms.push(termToAdd)
    
                break
              }
            }

            terms.push(charName)

            const reversedName = charName.split(/\s/).reverse().join(' ')
  
            if (reversedName !== charName) terms.push(reversedName)
          }

          if (!character.altNames || !character.altNames.length) continue

          const altNames = character.altNames.filter(altName => lang === 'jp' ? jpRegex.test(altName) : !jpRegex.test(altName))

          altNames.filter(altName => !!altName.trim()).forEach(altName => {
            terms.push(altName)

            const flippedAltName = altName.split(/\s/).reverse().join(' ')

            if (altName !== flippedAltName) terms.push(flippedAltName)
          })
        }
        
        break

      case 'classification':
        const classification = termsData.classification

        if (!classification) break

        for (let k = 0; k < termAliases.length; k++) {
          const [aliasRegex, termToAdd] = termAliases[k]
          
          if (aliasRegex.test(hiraganaToKatakana(classification))) terms.push(termToAdd)
        }

        separateTerm('classification', classification, figure).forEach(termValue => terms.push(termValue))

        if (classification.includes('Dollfie Dream')) terms.push('DD')

        break

      case 'manufacturer':
        if ((figure.category === 'Garage Kits' || figure.classification === 'Doujin Figure') && termsData.sculptor) {
          terms.push(termsData.sculptor)
  
          for (let k = 0; k < termAliases.length; k++) {
            const [aliasRegex, termToAdd] = termAliases[k]
            
            if (aliasRegex.test(hiraganaToKatakana(termsData.sculptor))) {
              terms.push(termToAdd)

              break
            }
          }
        }

        if (termsData.distributor) {
          for (let k = 0; k < termAliases.length; k++) {
            const [aliasRegex, termToAdd] = termAliases[k]
            
            if (aliasRegex.test(hiraganaToKatakana(termsData.distributor))) {
              terms.push(termToAdd)
  
              break
            }
          }

          terms.push(termsData.distributor)
        }

        if (termsData.manufacturer) {
          for (let k = 0; k < termAliases.length; k++) {
            const [aliasRegex, termToAdd] = termAliases[k]
            
            if (aliasRegex.test(hiraganaToKatakana(termsData.manufacturer))) {
              terms.push(termToAdd)
  
              break
            }
          }

          separateTerm('manufacturer', termsData.manufacturer, figure).forEach(termValue => terms.push(termValue))
        }

        break

      case 'jan':
        figure.releases.filter(release => !!release.jan).forEach(release => terms.push(release.jan || ''))

        break

      case 'title':
        const title = termsData.title || figure.title

        if (!title) break

        title.split(/(&|and|と)/ui).forEach(substring => terms.push(substring))

        for (let k = 0; k < termAliases.length; k++) {
          const [aliasRegex, termToAdd] = termAliases[k]
          
          if (aliasRegex.test(hiraganaToKatakana(title))) terms.push(termToAdd)
        }
        
        break


      default:
        if (!term) break

        let termValue = (['char', 'manufacturer', 'title', 'version', 'origin', 'classification'].includes(term) ? termsData[term as keyof FigureData] : figure[term]) || ''

        if (!termValue) break

        for (let k = 0; k < termAliases.length; k++) {
          const [aliasRegex, termToAdd] = termAliases[k]
          
          if (aliasRegex.test(hiraganaToKatakana(termValue))) terms.push(termToAdd)
        }

        if (term === 'version') {
          if (lang === 'jp') {
            termValue = cleanString(termValue.replaceAll(/[^\s\w\p{L}\u3099\u309A]/gu, '').replaceAll(/[^\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]+$/g, '')) || termValue
          } else {
            termValue = termValue.replace(/\sver(sion|\.)/i, '')
          }
        }

        separateTerm(term, termValue, figure).forEach(termValue => terms.push(termValue))
    }

    const titleContainsTerms = terms.filter(term => {
      const lowerCaseTerm = cleanString(term)
      const isTermInTitle = index !== null ? lowerCaseTitle.indexOf(lowerCaseTerm) === index : lowerCaseTitle.indexOf(lowerCaseTerm) > -1

      // console.log('Term', lowerCaseTerm, `is ${isTermInTitle ? '' : 'not '}contained in title`, lowerCaseTitle)

      return isTermInTitle
    }).length > 0
    
    if (!titleContainsTerms) return false
  }

  return true
}
  
export async function checkTitle (title: string, figure: Figure, shop: Shop, references: string[] = []) {
  const lowerCaseTitle = cleanString(title)

  if (!lowerCaseTitle) return false

  if (shop.checkForBootlegs) {
    if (/(cn|china)\s+ver/i.test(title)) {
      // console.log('Title', title, 'contains "CN/China ver", indicating it is a bootleg, skipping.')

      return false
    }
  }

  if (shop.compareWithFigureName) {
    const figureName = figure.name.replace(/\[NSFW\+?\] \- /, '')

    if (lowerCaseTitle.indexOf(cleanString(figureName)) >= 0) return true

    const similarity = compareTwoStrings(title.toLowerCase(), figureName.toLowerCase())

    // console.log(`Similarity between '${title}' and '${figureName}': ${similarity}`)

    return similarity >= 0.8
  }

  if (
    !!figure.category &&
    !['Prepainted', 'Garage Kits', 'Action/Dolls', 'Model Kits'].includes(figure.category) &&
    /(figure|(?:[^\d])?(\d[\/\/\uFF0F]\d+)(?:[^\d])?)/i.test(title)
  ) {
    // console.log('Listing "', title, '"does not seem to be of category', figure.category, ', skipping.')

    return false
  }

  if (
    !!figure.category &&
    figure.category !== 'Garage Kits' &&
    /(resin kit|garage kit|[^a-z]GK[^a-z])/i.test(title)
  ) {
    // console.log('Listing "', title, '"seems to be a garage kit, skipping.')

    return false
  }

  if (figure.version && /bunny/i.test(figure.version) && !/bare leg/i.test(figure.version)) {
    if (/(bare leg|生足)/ui.test(title)) {
      // console.log('Title "', title, '"indicates that the figure is a bare leg version, skipping.')

      return false
    }
  }

  if (/(birthday|anniversary)(\w+)?set/i.test(lowerCaseTitle)) {
    // console.log('Listing "', title, '"seems to be a set of random goods, skipping.')

    return false
  }

  const studioName = (/\w+\sstudios?/i.exec(title) || [])[0]

  if (!!studioName && !substringIsPresentInReferences(studioName, references)) {
    // console.log('Listing "', title, '"seems to be a bootleg, skipping.')

    return false
  }

  if (
    figure.classification !== 'Cosplay' &&
    /(cosplay|コスプレ)/ui.test(title) &&
    !substringIsPresentInReferences(/(cosplay|コスプレ)/ui, references)
  ) {
    // console.log('Listing "', title, '" seems to be a cosplay but item is not, skipping.')

    return false
  }

  if (
    !!figure.scale &&
    /(prize|[^a-z]sq[^a-z]|くじ)/ui.test(title) &&
    !substringIsPresentInReferences(/(prize|[^a-z]sq[^a-z]|くじ)/ui, references)
  ) {
    // console.log('Listing "', title, '" seems to be a prize figure but item is not, skipping.')

    return false
  }

  if (!!figure.scale && figure.scale !== 'Non Scale') {
    const scale = (/(?:[^\d])?(\d[\/\/\uFF0F]\d+)(?:[^\d])?/.exec(title) || [])[1]

    if (!!scale) {
      // console.log('Found scale', scale, 'in title', title)

      const denominator = parseFloat(scale.split('/')[1])
      const figureScaleDenominator = parseFloat(figure.scale.split('/')[1])

      if (Math.abs(denominator - figureScaleDenominator) > 1) {
        // console.log('Scale found in title', scale, 'and scale of item', figure.scale, 'are too different. Skipping.')

        return false
      }
    }
  }

  const termsData = shop.termsLang && figure[shop.termsLang] ? figure[shop.termsLang] : figure

  const otherCategories = NORMALIZED_COMMON_CATEGORIES
    .filter(CATEGORIES => !CATEGORIES.find(CATEGORY => cleanString(figure.category || '').includes(CATEGORY))) // removes the item's category and its synonyms from the list
    .filter(CATEGORIES => !CATEGORIES.find(CATEGORY => cleanString(figure.classification || '').includes(CATEGORY))) // removes the item's classification and its synonyms from the list to prevent conflicts with classifications as type
    .map(CATEGORIES => CATEGORIES.filter(CATEGORY => !substringIsPresentInReferences(CATEGORY, references))) // removes the categories that appear in the item's data to prevent filtering it out by mistake if they appear in the title
  const wrongCategories = otherCategories.filter(CATEGORIES => CATEGORIES.find(CATEGORY => lowerCaseTitle.includes(CATEGORY)))

  if (wrongCategories.length > 0) {
    // console.log('Listing contains the wrong categories', wrongCategories, ', skipping.')

    return false
  }

  const otherClassifications = NORMALIZED_COMMON_CLASSIFICATIONS
    .filter(CLASSIFICATIONS => !CLASSIFICATIONS.find(CLASSIFICATION => cleanString(figure.classification || '').includes(CLASSIFICATION))) // removes the item's classification and its synonyms from the list
    .filter(CLASSIFICATIONS => !CLASSIFICATIONS.find(CLASSIFICATION => cleanString(figure.category || '').includes(CLASSIFICATION))) // removes the item's category and its synonyms from the list to prevent conflicts with classifications as type
    .map(CLASSIFICATIONS => CLASSIFICATIONS.filter(CLASSIFICATION => !substringIsPresentInReferences(CLASSIFICATION, references))) // removes the classifications that appear in the item's data to prevent filtering it out by mistake if they appear in the title
  const wrongClassifications = otherClassifications.filter(CLASSIFICATIONS => CLASSIFICATIONS.find(CLASSIFICATION => lowerCaseTitle.includes(CLASSIFICATION)))

  if (wrongClassifications.length > 0) {
    // console.log('Listing contains the wrong classifications', wrongClassifications, ', skipping.')

    return false
  }

  const otherManufacturers = NORMALIZED_COMMON_MANUFACTURERS
    .filter(MANUFACTURERS => {
      return !MANUFACTURERS.find(MANUFACTURER => {
        const cleanedString = cleanString(figure.manufacturer + (figure.distributor ? (' ' + figure.distributor) : '') || '')

        return cleanedString.includes(MANUFACTURER)
      })
    }) // removes the item's manufacturer and its synonyms from the list
  const wrongManufacturers = otherManufacturers.filter(MANUFACTURERS => MANUFACTURERS.find(MANUFACTURER => lowerCaseTitle.includes(MANUFACTURER)))

  if (wrongManufacturers.length > 0) {
    // console.log('Listing contains the wrong manufacturers', wrongManufacturers, ', skipping.')

    return false
  }

  const otherVersions = NORMALIZED_COMMON_VERSIONS
    .filter(VERSIONS => !VERSIONS.find(VERSION => cleanString(figure.version || '').includes(VERSION))) // removes the item's version and its synonyms from the list
    .map(VERSIONS => VERSIONS.filter(VERSION => !substringIsPresentInReferences(VERSION, references))) // removes the versions that appear in the item's data to prevent filtering it out by mistake if they appear in the title
  const wrongVersions = otherVersions.filter(VERSIONS => VERSIONS.find(VERSION => lowerCaseTitle.includes(VERSION)))

  if (wrongVersions.length > 0) {
    // console.log('Listing contains the wrong versions', wrongVersions, ', skipping.')

    return false
  }

  if (shop.termsToCheck) {
    if (!(await termIsContainedInTitle(shop.termsToCheck, shop.termsLang || 'en', figure, title))) return false
  }

  if (shop.stringSimilarity && references && references.length) {
    // console.log('Checking string similarity of title', title, 'against the following references:', references)

    function updateReference (reference: string, matchers: [SearchTerm, boolean | string, string | null][], action: 'prepend' | 'append' | 'remove' = 'prepend') {
      for (let j = 0; j < matchers.length; j++) {
        const [term, equals, string] = matchers[j]
        const condition = typeof equals === 'boolean' ? !!figure[term] : figure[term]?.trim() === equals

        if (!condition) continue

        const updaterString = string ? string.replaceAll(/\{([a-z]+)\}/g, (match: string, term: SearchTerm) => figure[term] || '') : figure[term]
        
        if (condition && updaterString) {
          switch (action) {
            case 'prepend':
              reference = `${updaterString} ${reference}`
              break

            case 'append':
              reference += ` ${updaterString}`
              break

            case 'remove':
              reference = reference.replace(updaterString, '')
              break
          }
        }
      }

      return reference
    }

    const isSimilarToReference = references.filter(reference => {
      if (shop.stringSimilarityPrepend) reference = updateReference(reference, shop.stringSimilarityPrepend)

      if (shop.stringSimilarityAppend) reference = updateReference(reference, shop.stringSimilarityAppend, 'append')

      if (shop.stringSimilarityRemove) reference = updateReference(reference, shop.stringSimilarityRemove.map(([term, equals, termToRemove]) => ([term, equals, figure[termToRemove] || ''])), 'remove')

      reference = reference.trim()

      const cleanTitle = title.replaceAll(/[^\w\p{L}\u3099\u309A]/gu, ' ').trim()
      const similarity = compareTwoStrings(cleanTitle.toLowerCase(), reference.toLowerCase())

      // console.log(`Similarity between '${cleanTitle}' and '${reference}': ${similarity}`)

      return similarity >= (shop.stringSimilarityThreshold || 0.8)
    }).length > 0

    if (!isSimilarToReference) return false
  }
  
  if (shop.inverseFilter && references && references.length) {
    // console.log('Inverse filtering title', title, 'against the following references:', references)

    const query: FilterQuery<any> = {
      _id: { $ne: figure._id },
      $or: [
        { char: figure.char },
        { chars: { $in: figure.chars } }
      ]
    }
    const termsData = shop.termsLang && figure[shop.termsLang as SearchLanguages] ? figure[shop.termsLang as SearchLanguages] : figure
    const originNames = await getSearches(termsData, ['origin'], figure, shop)

    for (let i = 0; i < originNames.length; i++) {
      const originName = originNames[i]
      
      if (!(await termIsContainedInTitle([['char', null]], shop.termsLang || 'en', figure, originName))) continue

      if (query.$or) query.$or.push({ origin: figure.origin })
    }

    const similarFigures = await Figures.find(query)

    function getTermValues (term: SearchTerm) {
      return similarFigures.flatMap(similarFigure => {
        const termValue = shop.termsLang ? similarFigure[shop.termsLang][term] : similarFigure[term]
        const values = [termValue]
        const termValueAliases = aliases[term] || []

        let isReplacedByAlias = false
        
        for (let j = 0; j < termValueAliases.length; j++) {
          const [aliasRegex, value, replace] = termValueAliases[j]
          
          if (aliasRegex.test(termValue)) {
            values.push(value)

            isReplacedByAlias = !!replace
          }
        }

        if (isReplacedByAlias) values.shift()

        return values
      })
    }

    const similarFiguresClassifications = new Set(getTermValues('classification'))
    // const similarFiguresManufacturers = new Set([...getTermValues('manufacturer'), ...getTermValues('distributor')])
    const similarFiguresVersions = new Set(similarFigures.flatMap(figure => {
      let version = shop.termsLang ? figure[shop.termsLang].version : figure.version

      if (!version) return ''

      if (shop.termsLang === 'jp') version = cleanString(version.replaceAll(/[^\s\w\p{L}\u3099\u309A]/gu, '').replaceAll(/[^\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]+$/g, '')) || version

      return separateTerm('version', version, figure).map(term => term.replace(/\sver(\.|sion)?/i, ''))
    }))
    const characterIDs = similarFigures.flatMap(similarFigure => similarFigure.chars)
    const similarFiguresCharacterIDs = new Set(characterIDs)
    const characters = await Characters.find({ _id: { $in: [...similarFiguresCharacterIDs] } })

    let charactersNames: string[] = []

    for (let i = 0; i < characters.length; i++) {
      const character = characters[i]
      const charNames = await getCharNames(character, shop)

      charactersNames = [...charactersNames, ...charNames]
    }

    // if (figure.origin) charactersNames = charactersNames.filter(charName => !cleanString((termsData.origin || figure.origin) as string).includes(cleanString(charName)))

    const similarFiguresCharactersNames = new Set(charactersNames)

    function hasWrongValue (stringToTest: string, set: Set<string>) {
      const setIterator = set.entries()
  
      for (const [wrongValue] of setIterator) {
        if (!wrongValue) continue
  
        const cleanedWrongValue = cleanString(wrongValue)
        const isContainedInReferences = !!(references || []).filter(reference => cleanString(reference).includes(cleanedWrongValue)).length
  
        if (isContainedInReferences) {
          // console.log(wrongValue, 'is contained in the references, ignoring')
  
          continue
        }
  
        if (cleanString(stringToTest).includes(cleanedWrongValue)) {
          // console.log(wrongValue, 'is contained in', stringToTest, ', skipping')
  
          return true
        }
      }

      return false
    }

    // console.log('Checking title "', title, '" against other classifications', similarFiguresClassifications)

    if (hasWrongValue(title, similarFiguresClassifications)) return false

    // console.log('Checking title "', title, '" against other manufacturers', similarFiguresManufacturers)

    // if (hasWrongValue(similarFiguresManufacturers)) return false

    // console.log('Checking title "', title, '" against other versions', similarFiguresVersions)

    if (hasWrongValue(title, similarFiguresVersions)) return false

    if (!figure.origin || !hasWrongValue(termsData.origin || figure.origin, similarFiguresCharactersNames)) {
      // console.log('Checking title "', title, '" against other characters', similarFiguresCharactersNames)
  
      if (hasWrongValue(title, similarFiguresCharactersNames)) return false
    }
  }

  return true
}

export async function isBlacklisted (result: UnparsedListing, figure: Figure, shop: Shop) {
  // console.log('Searching for existing listings for figure', figure._id.toString(), 'in', shop.name, 'with url', result.url)

  const listings = await Listings.find({ figure: figure._id, url: result.url })

  if (!!listings && !!listings.length) {
    // console.log(listings.length, 'existing listings found for figure', figure._id.toString(), 'in', shop.name, 'with url', result.url)

    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i]

      if (listing.isWrong) {
        // console.log('Wrong listing found for figure', figure._id.toString(), 'in', shop.name, 'with url', result.url, ', filtering out the result...')

        return true
      }
  
      const reports = await Reports.find({ figure: figure._id, listing: listing._id, isConfirmed: true })

      if (!!reports && !!reports.length) {
        // console.log(reports.length, 'reports found for figure', figure._id.toString(), 'in', shop.name, 'with url', result.url, ', filtering out the result...')

        return true
      }
    }
  }

  return false
}

function getTitle ($: cheerio.CheerioAPI, node: AnyNode, shop: Shop) {
  const { titleSelector, isTitleSelectorGlobal, titleAttr, titleAttrRemove, getTitleAttr } = shop

  if (!titleSelector) return ''

  const titleNode = (isTitleSelectorGlobal ? $(titleSelector) : $(node).find(titleSelector)).get()[0]

  if (!titleNode) {
    console.error('Title node could not be found.')

    return ''
  }

  const titleEl = $(titleNode)

  // if (!titleEl || !titleEl.length) {
  //   console.error('Title element could not be found.')
  
  //   return ''
  // }

  const titleAttribute = titleAttr || ''

  if (!!titleAttribute && !!titleEl.attr(titleAttribute)) {
    let title = (titleEl.attr(titleAttribute) || '').trim()

    if (titleAttrRemove) title = title?.replace(titleAttrRemove, '').trim()

    if (title) return title
  }

  if (getTitleAttr === false || !titleEl.attr('title')) return (titleEl.text() || '').trim()

  return (titleEl.attr('title') || '').trim()
}

function hasBuyButton ($: cheerio.CheerioAPI, node: AnyNode, isGlobal: boolean, selector?: string) {
  if (!selector) return true

  const buttonNode = (isGlobal ? $(selector) : $(node).find(selector)).get()[0]

  if (!buttonNode) return false

  return true
}

function isAvailable ($: cheerio.CheerioAPI, node: AnyNode, shop: Shop) {
  const {
    isInStockSelectorGlobal,
    inStockSelectors,
    isSoldOutSelectorGlobal,
    soldOutSelectors,
    soldOutTextContent
  } = shop

  if (inStockSelectors) {
    for (let i = 0; i < inStockSelectors.length; i++) {
      const inStockSelector = inStockSelectors[i]
      const inStockNodes = isInStockSelectorGlobal ? $(inStockSelector).get() : $(node).find(inStockSelector).get()
  
      if (!inStockNodes || !inStockNodes.length) continue
  
      for (let j = 0; j < inStockNodes.length; j++) {
        const inStockEl = $(inStockNodes[j])
        const isHidden = inStockEl.attr('hidden') ||
          inStockEl.css('display') === 'none' ||
          inStockEl.css('visibility') === 'hidden' ||
          inStockEl.css('opacity') === '0'
  
        if (isHidden) continue
  
        return true
      }
    }
  }

  if (soldOutSelectors) {
    for (let i = 0; i < soldOutSelectors.length; i++) {
      const soldOutSelector = soldOutSelectors[i]
      const soldOutNodes = isSoldOutSelectorGlobal ? $(soldOutSelector).get() : $(node).find(soldOutSelector).get()
  
      if (!soldOutNodes || !soldOutNodes.length) continue
  
      for (let j = 0; j < soldOutNodes.length; j++) {
        const soldOutEl = $(soldOutNodes[j])
        const isHidden = soldOutEl.attr('hidden') ||
          soldOutEl.css('display') === 'none' ||
          soldOutEl.css('visibility') === 'hidden' ||
          soldOutEl.css('opacity') === '0'
  
        if (isHidden) continue
  
        if (!soldOutTextContent || !soldOutTextContent.length) return false
  
        for (let k = 0; k < soldOutTextContent.length; k++) {
          const currTextContent = soldOutTextContent[k]
          const elTextContent = (soldOutEl.text() || '').replaceAll(/[\s\n]/g, ' ')
          
          if (currTextContent && elTextContent && elTextContent.includes(currTextContent)) return false
        }
      }
    }
  }

  return true
}

export function isRightItem ($: cheerio.CheerioAPI, node: AnyNode, checkTerms: [string, SearchTerm][] | undefined, termsLang: 'jp' | undefined, figure: Figure) {
  if (!checkTerms) {
    // console.log('Nothing to check for', figure.name, ', item is considered correct.')

    return true
  }

  const wrongTerms = checkTerms.filter(([selector, term]) => {
    const termsData = termsLang && figure[termsLang as SearchLanguages] ? figure[termsLang as SearchLanguages] : figure
    const text: string = $(node).find(selector).text()

    if (!text) {
      // console.log('No text found for', figure.name, ', can\'t confirm if it is the right item')

      return false
    }

    const terms = []
    const termAliases: [RegExp, string, boolean?][] = aliases[term] || []

    switch (term) {
      case 'jan':
        const jans = figure.releases.map(release => release.jan).filter(jan => !!jan)

        if (!jans || !jans.length) {
          // console.log('No JANs found for', figure.name, ', treating as correct.')

          return false
        }

        const hasWrongJan = jans.filter(jan => jan && text.includes(jan)).length === 0

        // if (hasWrongJan) console.log('Page contains the wrong JAN.')

        return hasWrongJan

      case 'scale':
        const hasWrongScale = !!figure.scale && !text.includes(figure.scale)

        // if (hasWrongScale) console.log('Page contains the wrong scale.')

        return hasWrongScale

      case 'manufacturer':
        if ((figure.category === 'Garage Kits' || figure.classification === 'Doujin Figure') && termsData.sculptor) {
          terms.push(termsData.sculptor)

          const termIndex = terms.length - 1

          let isReplacedByAlias = false
  
          for (let k = 0; k < termAliases.length; k++) {
            const [aliasRegex, termToAdd, replace] = termAliases[k]
            
            if (aliasRegex.test(hiraganaToKatakana(termsData.sculptor))) {
              terms.push(termToAdd)

              isReplacedByAlias = !!replace
            }
          }

          if (isReplacedByAlias) terms.splice(termIndex, 1)
        }

        if (termsData.distributor) {
          terms.push(termsData.distributor)

          const termIndex = terms.length - 1

          let isReplacedByAlias = false
  
          for (let k = 0; k < termAliases.length; k++) {
            const [aliasRegex, termToAdd, replace] = termAliases[k]
            
            if (aliasRegex.test(hiraganaToKatakana(termsData.distributor))) {
              terms.push(termToAdd)

              isReplacedByAlias = !!replace
            }
          }

          if (isReplacedByAlias) terms.splice(termIndex, 1)
        }

        if (termsData.manufacturer) {
          terms.push(termsData.manufacturer)

          const termIndex = terms.length - 1

          let isReplacedByAlias = false

          for (let k = 0; k < termAliases.length; k++) {
            const [aliasRegex, termToAdd, replace] = termAliases[k]
            
            if (aliasRegex.test(hiraganaToKatakana(termsData.manufacturer))) {
              terms.push(termToAdd)

              isReplacedByAlias = !!replace
            }
          }

          if (isReplacedByAlias) terms.splice(termIndex, 1)
        }

        break

      default:
        if (!term) break

        const termToCheck: string = termsData[term as keyof FigureData] || ''

        terms.push(termToCheck)

        const termIndex = terms.length - 1

        let isReplacedByAlias = false

        for (let k = 0; k < termAliases.length; k++) {
          const [aliasRegex, termToAdd, replace] = termAliases[k]
          
          if (aliasRegex.test(hiraganaToKatakana(termToCheck))) {
            terms.push(termToAdd)

            isReplacedByAlias = !!replace
          }
        }

        if (isReplacedByAlias) terms.splice(termIndex, 1)
    }

    // console.log('Checking terms', terms, text)

    const hasWrongTerm = terms.filter(termToCheck => {
      const cleanTermToCheck = cleanString(termToCheck)
      const isTermCorrect = !!cleanTermToCheck && cleanString(text).includes(cleanTermToCheck)

      // if (!isTermCorrect) console.log('Term', cleanTermToCheck, 'is not similar to', termToCheck)

      return isTermCorrect
    }).length === 0

    // if (hasWrongTerm) console.log('Page contains a wrong term.')

    return hasWrongTerm
  })

  return wrongTerms.length === 0
}

function getPrice (
  $: cheerio.CheerioAPI,
  node: AnyNode,
  figure: Figure,
  shop: Shop
) {
  const {
    priceSelectors,
    isPriceSelectorGlobal,
    includeHiddenPrice,
    priceDivider,
    priceDividerExceptions,
    priceIgnoreSelector
  } = shop

  let price = ''

  for (let i = 0; i < priceSelectors.length; i++) {
    const priceSelector = priceSelectors[i]
    const priceNode = isPriceSelectorGlobal ? $(priceSelector).get()[0] : $(node).find(priceSelector).get()[0]

    if (!priceNode) {
      // console.log('No price node found for selector', priceSelector)

      continue
    }

    if (includeHiddenPrice === false) {
      const priceEl = $(priceNode)
  
      if (
        priceEl.attr('hidden') ||
        priceEl.css('display') === 'none' ||
        priceEl.css('visibility') === 'hidden' ||
        priceEl.css('opacity') === '0'
      ) continue
    }

    price = $(priceNode).text().trim() || ''

    if (!price) {
      // console.log('No price found for selector', priceSelector)

      continue
    }

    if (priceDivider) {
      const prices = price.split(priceDivider[0])

      let dividerIndex = priceDivider[1]

      if (priceDividerExceptions) {
        for (let i = 0; i < priceDividerExceptions.length; i++) {
          const [term, regex, index] = priceDividerExceptions[i]
          
          if (regex.test(figure[term] || '')) dividerIndex = index
        }
      }

      price = prices[dividerIndex] || prices[0]
    }

    if (priceIgnoreSelector) {
      const ignoreNodes = $(priceNode).find(priceIgnoreSelector).get()

      for (let j = 0; j < ignoreNodes.length; j++) {
        const ignoreEl = $(ignoreNodes[j])
        
        if (ignoreEl.text()) price = price.replace(ignoreEl.text(), '')
      }
    }

    if (price) break
  }

  return price
}

function isPriceTBD ($: cheerio.CheerioAPI, node: AnyNode, priceTBDSelector: [string?, string?], title?: string) {
  const [selector, stringToMatch] = priceTBDSelector

  let textToCheck = title || ''

  if (!!selector) {
    const el = $(node).find(selector).get()[0]

    if (!stringToMatch) return !!el

    textToCheck = $(el).text()
  }

  // console.log('textToCheck', textToCheck)

  return stringToMatch ? textToCheck.includes(stringToMatch) : false
}

function getUrl ($: cheerio.CheerioAPI, node: AnyNode, shop: Shop, url: string = '') {
  // console.log('Parsing URL', url)

  if (shop.linkSelector) {
    const routeEl = shop.linkIsSelf ? $(node) :
      (shop.isLinkSelectorGlobal ? $(shop.linkSelector) : $(node).find(shop.linkSelector))

    let tempUrl = ''

    if (shop.linkSelectorGetItemCode) {
      const [classToCheck, attributeForItemCode, urlToPrepend] = shop.linkSelectorGetItemCode

      if (routeEl.hasClass(classToCheck)) {
        const itemCode = routeEl.attr(attributeForItemCode)

        if (itemCode) tempUrl = urlToPrepend + itemCode
      }
    }

    if (tempUrl) {
      url = tempUrl
    } else {
      const route = ((routeEl ? routeEl.attr("href") : '') || '').trim()
    
      url = (route && route.trim().indexOf('http') === 0 ? '' : (shop.url + (route.charAt(0) === '/' ? '' : '/'))) + route
    }
  }

  if (!url) return null

  if (shop.cleanUrl) {
    const partToRemove = (shop.cleanUrl.exec(url) || [])[1] || ''

    url = url.replace(partToRemove, '')
  }

  if (shop.urlRemoveParams) {
    const urlObject = new URL(url)

    for (let i = 0; i < shop.urlRemoveParams.length; i++) {
      const param = shop.urlRemoveParams[i]
      
      urlObject.searchParams.delete(param)
    }

    url = urlObject.toString()
  }

  if (!!shop.itemIdRegex && !!shop.replaceUrl) {
    const itemId = (shop.itemIdRegex.exec(url) || [])[1]

    if (itemId) url = shop.replaceUrl + itemId
  }

  // if (shop.affiliateReplaceUrl) url = url.replace(shop.affiliateReplaceUrl[0], shop.affiliateReplaceUrl[1])

  // if (shop.affiliateUrlAppend) url = url + shop.affiliateUrlAppend

  // if (shop.affiliateAddParams) {
  //   const urlObject = new URL(url)

  //   for (let j = 0; j < shop.affiliateAddParams.length; j++) {
  //     const [param, value] = shop.affiliateAddParams[j]
      
  //     urlObject.searchParams.set(param, value)
  //   }

  //   url = urlObject.toString()
  // }

  return url.replace(/\#$/, '')
}

function getItemCondition ($: cheerio.CheerioAPI, node: AnyNode, shop: Shop) {
  if (shop.itemConditionUsedSelectors) {
    for (let i = 0; i < shop.itemConditionUsedSelectors.length; i++) {
      const [selector, valueToMatch, isSelf] = shop.itemConditionUsedSelectors[i]
      const conditionNode = isSelf && $(node).hasClass(selector.replace('.', '')) ? node : $(node).find(selector).get()[0]
    
      if (!conditionNode) continue
    
      const conditionEl = $(conditionNode)
    
      if (
        conditionEl.attr('hidden') ||
        conditionEl.css('display') === 'none' ||
        conditionEl.css('visibility') === 'hidden' ||
        conditionEl.css('opacity') === '0'
      ) continue
    
      const elTextContent = conditionEl.text()
      const valueMatches = !valueToMatch || !!(elTextContent && elTextContent.toLowerCase().includes((valueToMatch as string).toLowerCase()))
    
      if (valueMatches) return 'used'
    }
  }

  if (shop.itemConditionNewSelectors) {
    for (let i = 0; i < shop.itemConditionNewSelectors.length; i++) {
      const [selector, valueToMatch, isSelf] = shop.itemConditionNewSelectors[i]
      const conditionNode = isSelf && $(node).hasClass(selector.replace('.', '')) ? node : $(node).find(selector).get()[0]
    
      if (!conditionNode) continue
    
      const conditionEl = $(conditionNode)
    
      if (
        conditionEl.attr('hidden') ||
        conditionEl.css('display') === 'none' ||
        conditionEl.css('visibility') === 'hidden' ||
        conditionEl.css('opacity') === '0'
      ) continue
    
      const elTextContent = conditionEl.text()
      const valueMatches = !valueToMatch || !!(elTextContent && elTextContent.toLowerCase().includes((valueToMatch as string).toLowerCase()))
    
      if (valueMatches) return 'new'
    }
  }

  return shop.itemCondition || 'new'
}

function getSeller ($: cheerio.CheerioAPI, node: AnyNode, shop: Shop) {
  if (!shop.sellerSelector) return undefined

  const sellerNode = $(node).find(shop.sellerSelector).get()[0]

  if (!sellerNode) return undefined

  const sellerEl = $(sellerNode)
  const seller = sellerEl.text().replace('（Overseas delivery is possible.）', '').trim()

  return seller || undefined
}

function getIsDomesticShippingOnly ($: cheerio.CheerioAPI, node: AnyNode, selector: [string, string?]) {
  const shippingNode = $(node).find(selector[0]).get()[0]

  if (!shippingNode) return false

  if (selector[1]) {
    const shippingText = $(shippingNode).text().trim()

    if (shippingText !== selector[1]) return false
  }

  return true
}

export default function getResults (pageContent: string, shop: Shop, url: string, figure: Figure) {
  const $ = cheerio.load(pageContent)

  let resultNodes = $(shop.resultsSelector).get()

  if ((!resultNodes || !resultNodes.length) && shop.alternateResultSelector) {
    // console.log('No results found with default selector, trying alternate selector.')

    resultNodes = $(shop.alternateResultSelector).get()
  }

  // console.log('Found', resultNodes.length, 'results nodes.')

  if (shop.resultsBeforeSelector) {
    resultNodes = resultNodes.filter(resultNode => {
      if (shop.resultsBeforeSelector === undefined) return true

      const [selector, match] = shop.resultsBeforeSelector
      const resultElement = $(resultNode)

      const index = resultElement.index()
      const separatorIndex = $(selector).filter((index, node) => typeof match === 'string' ? $(node).text().includes(match) : match).index()

      if (separatorIndex < 0) return true

      return index < separatorIndex
    })

    // console.log(resultNodes.length, 'nodes left after eliminating nodes placed after the deliminating element')
  }

  const listingsArray: UnparsedListing[] = []

  let title = ''

  if (shop.isTitleSelectorGlobal && shop.titleSelector) {
    const titleEl = $(shop.titleSelector).get()[0]

    if (titleEl) title = getTitle($, titleEl, shop)
  }

  return resultNodes.reduce((resultArray, result) => {
    const resultTitle = getTitle($, result, shop) || title

    // console.log('Result title:', resultTitle)

    if (!hasBuyButton($, result, !!shop.isSoldOutSelectorGlobal, shop.buttonSelector)) {
      // console.log('Result for', figure._id.toString(), 'in', shop.name, 'has been filtered out: buy button absent')

      return resultArray
    }

    if (!isAvailable($, result, shop)) {
      // console.log('Result for', figure._id.toString(), 'in', shop.name, 'has been filtered out: not available')

      return resultArray
    }

    if (!isRightItem($, result, shop.checkTerms, shop.termsLang, figure)) {
      // console.log('Result for', figure._id.toString(), 'in', shop.name, 'has been filtered out: wrong item')

      return resultArray
    }

    const price = getPrice($, result, figure, shop)

    if (!price) {
      // console.log('Result for', figure._id.toString(), 'in', shop.name, 'has been filtered out: cannot find the price')

      return resultArray
    }

    const priceIsTBD = shop.priceTBDSelector ? isPriceTBD($, result, shop.priceTBDSelector, resultTitle) : undefined

    url = getUrl($, result, shop, url) || url

    const condition = getItemCondition($, result, shop)
    const isDomesticShippingOnly = shop.isDomesticShippingOnlySelector ? getIsDomesticShippingOnly($, result, shop.isDomesticShippingOnlySelector) : false

    const unparsedListing: UnparsedListing = {
      id: shop.name,
      title: resultTitle,
      price,
      currency: shop.currency,
      priceIsTBD,
      url,
      condition,
      isDomesticShippingOnly
    }

    const seller = getSeller($, result, shop)

    if (seller) unparsedListing.seller = seller

    resultArray.push(unparsedListing)

    return resultArray
  }, listingsArray)
}

export async function getOriginAltNames (page: Page, name: string, link: string) {
  try {
    const origin = await Origins.findOne({ name })

    if (origin) return origin
  } catch (error) {
    console.error('Error when getting the origin from the database', error)

    throw new Error('Error when getting the origin from the database')
  }

  let prevUrl = ''

  try {
    prevUrl = page.url()

    await page.goto(link, { waitUntil: 'domcontentloaded' })

    const pageContent = await page.content()
    const $ = cheerio.load(pageContent)

    const nth = $('.data .data-field:nth-child(3) .data-label').text() === 'Original name' ? 4 : 3
    const fieldTitle = $(`.data .data-field:nth-child(${nth}) .data-label`).text()
    const originData: { name: string, altNames?: string[] } = { name }

    if (fieldTitle === 'Aliases') {
      const altNamesEl = $(`.data .data-field:nth-child(${nth}) .data-value`).html() || ''
      const altNames = altNamesEl
        .replaceAll('&nbsp;', '')
        .split('<br>')
        .map(altName => altName.replaceAll(/\<small\>\([\w\s]+\)\<\/small\>/g, '').replaceAll(/\<\/?[a-z]+\>/g, ' ').trim())
        .filter(altName => altName.length)

      originData.altNames = altNames
    }

    return await Origins.create(originData)
  } catch (error) {
    console.error('Couldn\'t get the origin\'s alternative names', error)
  } finally {
    if (prevUrl) await page.goto(prevUrl, { waitUntil: 'domcontentloaded' })
  }
}

export async function getCharAltNames (page: Page, link: string) {
  const mfcId = (/myfigurecollection\.net\/entry\/([0-9]+)/.exec(link) || [])[1]

  try {
    if (mfcId) {
      const character = await Characters.findOne({ mfcId })

      if (character) return character
    }
  } catch (error) {
    console.error('Error when getting the character from the database', error)

    throw new Error('Error when getting the character from the database')
  }

  // console.log('Getting character alt names at', link)

  let prevUrl = ''

  try {
    prevUrl = page.url()

    const mfcAuthRedisKey = `mfcAuthCookies`

    if (await redis.exists(mfcAuthRedisKey)) {
      const cookies = JSON.parse(await redis.get(mfcAuthRedisKey) || '[]')
      const browser = await page.browser()

      await browser.setCookie(...cookies)
    }

    let gotoRetries = 0

    do {
      try {
        await page.goto(link, {
          waitUntil: 'domcontentloaded'
        })

        break
      } catch (error) {
        console.error('Error trying to go to figure MFC page', link, ':', error)

        gotoRetries++
      }
    } while (gotoRetries < 3)

    const pageContent = await page.content()
    const $ = cheerio.load(pageContent)
    const name = $('.data .data-field:nth-child(2) .data-value strong').text() || ''

    let originalName = ''
    let offset = 0

    if ($('.data .data-field:nth-child(3) .data-label').text() === 'Original name') {
      originalName = $('.data .data-field:nth-child(3) .data-value').text() || ''
      offset++
    }

    const fieldTitle = $(`.data .data-field:nth-child(${3 + offset}) .data-label`).text()
    const characterData: {
      mfcId: string,
      name: string,
      originalName: string,
      altNames?: string[]
    } = { name, mfcId, originalName }

    if (fieldTitle === 'Aliases') {
      const altNamesEl = $(`.data .data-field:nth-child(${3 + offset}) .data-value`).html() || ''
      const altNames = altNamesEl
        .replaceAll('&nbsp;', '')
        .split('<br>')
        .map(altName => altName.replaceAll(/\<small\>\([\w\s]+\)\<\/small\>/g, '').replaceAll(/\<\/?[a-z]+\>/g, ' ').trim())
        .filter(altName => altName.length)

      characterData.altNames = altNames
    }

    const character = await Characters.create(characterData)

    return character
  } catch (error) {
    console.error('Couldn\'t get the character\'s alternative names', error)
  } finally {
    if (prevUrl) await page.goto(prevUrl, { waitUntil: 'domcontentloaded' })
  }
}
