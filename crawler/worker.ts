import { Browser, Cookie, Page } from 'rebrowser-puppeteer'
import * as cheerio from 'cheerio'
import { Job, Worker, WorkerOptions } from 'bullmq'
import dotenv from 'dotenv'
import { FigureWorkerJob, ListingWorkerJob, MfcLinkWorkerJob, WorkerJob } from '../types/WorkerJob'
import { UnparsedListing, checkTitle, isBlacklisted, getMfcListings, getSearches, updatePrice, isRightItem, openBrowser, getPageContentFromCloud, getOriginAltNames, getCharAltNames, cleanup, getResultsFromScript, parseAPIResults, getAPIResults, getPageContentFromCloudflare } from './utils'
import getPageContent from './utils/getPageContent'
import prepareBrowserPage from './utils/prepareBrowserPage'
import getResults from './utils'
import { shops } from '../data/shops'
import { Shop, SearchLanguages, SearchTerm } from '../types/Shops'
import connectDB from '../api/utils/connectDB'
import { barcodeRegex } from '../mixins/barcodeRegex'
import redis from '../api/utils/redisClient'
import ShopSearches from '../api/models/ShopSearch'
import Errors from '../api/models/Error'
import Figures from '../api/models/Figure'
import Listings from '../api/models/Listing'
import { Listing } from '../types/Listing'
import { FigureData, FigureInfos } from '../types/Figure'
import { imageSrcRegex } from '../mixins/imageSrcRegex'
import { Character } from '../types/Character'
import getCurrency from '../api/utils/getCurrency'
import { jpRegex } from '../mixins/jpRegex'
import { doNotTranslate } from '../data/doNotTranslate'
import { mfcLinkRegex } from '../mixins/mfcLinkRegex'
import { mfcSignIn } from '../api/utils/mfcAuthentification'
import NoHits from '../api/models/NoHit'
import figureReleaseDate from '../api/utils/figureReleaseDateForComparison'

(async () => {
  process.setMaxListeners(100)
  dotenv.config()

  connectDB()

  const TWO_MONTHS = 1000 * 60 * 60 * 24 * 30 * 2

  // let localBrowser = await puppeteer.launch(browserOptions)

  // console.log('Launched browser', await localBrowser.version())

  // // await prepareBrowserPage(localBrowser)

  // localBrowser.on('disconnected', launchBrowser)
  // localBrowser.on('close', launchBrowser)

  // async function launchBrowser () {
  //   if (testMode) console.log('Browser disconnected, relaunching...')

  //   localBrowser = await puppeteer.launch(browserOptions)

  //   // await prepareBrowserPage(localBrowser)

  //   localBrowser.on('disconnected', launchBrowser)
  //   localBrowser.on('close', launchBrowser)
  // }

  // process.on('SIGTERM', async () => {
  //   if (testMode) console.log('SIGTERM received, cleaning up...')

  //   localBrowser.off('disconnect', launchBrowser)
  //   localBrowser.off('close', launchBrowser)

  //   await localBrowser.close()

  //   process.exit(0)
  // })

  await redis.set('localPageCount', '0')

  const workerHandler = async (job: Job<WorkerJob>) => {
    const shop: Shop = shops[job.data.shop]
    const figure = job.data.figure
    const testMode = !!job.data.testMode

    if (testMode) console.log(`Worker started the job #${job.id}: ${job.data.shop}/${figure._id.toString()}`)

    let browser: Browser | null = null
    let isUsingOwnIp = false
    let timeout: NodeJS.Timeout | null = null
    let page: Page | null = null
    let errorOccured: boolean = false

    let results: UnparsedListing[] = []

    try {
      const releasesWithJans: any[] = figure.releases.filter(release => !!release.jan)
      const jans: string[] = [...(new Set(releasesWithJans.map(release => release.jan)))]

      if (
        (!job.data.options || !job.data.options.searches || job.data.options.searches.length === 0) &&
        job.data.urls && job.data.urls.length
      ) {
        const urls = job.data.urls

        for (let i = 0; i < urls.length; i++) {
          const url = urls[i]

          try {
            const currentBrowser: Browser | null = browser
            const openedBrowser: {
              isUsingOwnIp: boolean
              browser: Browser
              timeout: NodeJS.Timeout | null
            } = await openBrowser(job.data.shop, figure, currentBrowser)
    
            isUsingOwnIp = openedBrowser.isUsingOwnIp
            browser = openedBrowser.browser
            timeout = openedBrowser.timeout
            page = await prepareBrowserPage(browser, shop)

            await redis.incr('localPageCount')
        
            if (testMode) console.log('New page open, current page count', await redis.get('localPageCount'))

            await page.goto(url, {
              waitUntil: shop.waitUntil || 'networkidle0'
            })
  
            const pageContent = [await page.content()]
            const urlResults = await getResults(pageContent[0], shop, url, figure)
  
            if (urlResults) results = [...results, ...urlResults]
          } catch (error: any) {
            // await page?.screenshot({
            //   fullPage: true,
            //   path: `./crawler/screenshots/${job.data.shop}-${error.message.replaceAll(/[^\w\-\s]/g, '')}.png`
            // })

            // await Errors.create({
            //   shop: job.data.shop,
            //   error: error.message,
            //   usingProxy: !isUsingOwnIp
            // })

            console.error('Error when trying to get page content at', url, ':', error)

            throw new Error('Error when trying to get page content')
          }
        }

        if (testMode) console.log('Found', results.length, 'results for figure', figure._id.toString(), 'in shop', job.data.shop)

        return results
      }

      if (job.data.shop === 'mfc') {
        if (!figure.mfcLink) {
          if (testMode) console.log('No results found for figure', figure._id.toString(), 'in MFC: no link')

          return []
        }

        try {
          const openedBrowser: {
            isUsingOwnIp: boolean
            browser: Browser
            timeout: NodeJS.Timeout | null
          } = await openBrowser(job.data.shop, figure)
  
          isUsingOwnIp = openedBrowser.isUsingOwnIp
          browser = openedBrowser.browser
          timeout = openedBrowser.timeout
          page = await prepareBrowserPage(browser, shop)

          await redis.incr('localPageCount')
      
          if (testMode) console.log('New page open, current page count', await redis.get('localPageCount'))
  
          await mfcSignIn(page)

          results = await getMfcListings(page, figure, shop)
        } catch (error: any) {
          // await page?.screenshot({
          //   fullPage: true,
          //   path: `./crawler/screenshots/${job.data.shop}-${error.message.replaceAll(/[^\w\-\s]/g, '')}.png`
          // })

          // await Errors.create({
          //   shop: job.data.shop,
          //   error: error.message,
          //   usingProxy: !isUsingOwnIp
          // })

          console.error('Error when trying to MFC listings:', error)

          throw new Error('Error when trying to MFC listings')
        }

        const filteredResults = []

        for (let i = 0; i < results.length; i++) {
          const result = results[i]
          const listing: Listing | null = await Listings.findOne({ url: result.url })

          if (!!listing && listing.isActive === false) continue

          filteredResults.push(result)
        }

        if (testMode) console.log('Found', filteredResults.length, 'results for figure', figure._id.toString(), 'in shop', job.data.shop)

        return filteredResults
      }
  
      const termsData = shop.termsLang && figure[shop.termsLang as SearchLanguages] ? figure[shop.termsLang as SearchLanguages] : figure

      let searches: string[] = []
      
      if (job.data.options && job.data.options.searches && job.data.options.searches.length > 0) {
        searches = job.data.options.searches
      } else {
        const shopSearches = await ShopSearches.find({
          shop: job.data.shop,
          figure: figure._id
        })

        searches = shopSearches.map(shopSearch => shopSearch.search)
      }

      if (!searches.length) {
        const canSearchByJan = shop.searchTerms.includes('jan')
  
        if ((!canSearchByJan || !jans.length) && (!figure || !figure.name)) {
          console.error('No figure info for', figure._id.toString(), 'and cannot search by JAN. Skipping the shop.')
  
          throw new Error("No figure info and cannot search by JAN. Skipping the shop.")
        }
  
        searches = canSearchByJan ? jans : []
  
        if (!searches.length || shop.retryIfResults || shop.retryIfNoResults) (
          (await getSearches(termsData, shop.searchTerms.slice(canSearchByJan ? 1 : 0), figure, shop)).slice(0, 8).forEach((search: string) => {
            if (/(nendoroid|ねんどろいど|figma|フィグマ|pop(\s)?up parade)/u.test(search)) search.replace(/(Good(\s)?Smile Company|グッドスマイル(\s)?カンパニー)/ui, '')

            searches.push(search.replaceAll(/[\u0300-\u036f]/g, ''))
          })
        )
  
        searches = searches.filter(search => shop.searchTerms.includes('') ? true : !!search)
      }

      if (testMode) console.log('Searching with: ', searches)

      for (let i = 0; i < searches.length; i++) {
        let search = searches[i]

        if (shop.searchTermsJoin) search = search.replaceAll(/\s/g, shop.searchTermsJoin)

        if (testMode) console.log('Current search: ', search, 'in', shop.name)

        const searchIsJan = barcodeRegex.test(search)

        let pageContents: string[] = []
        let url = ''
        let searchResults: UnparsedListing[] = []

        if (shop.useScript) {
          if (testMode) console.log(`Searching ${search} using a script`)

          const data = await getResultsFromScript(shop.useScript, search)
          
          let items: any[] = data[shop.resultsSelector]

          if (!items || !items.length) continue

          searchResults = await parseAPIResults(shop, items)
        } else if (shop.hasAPI) {
          let shopCookies: Cookie[] = []
          let bearerToken: string | null = ''

          if (shop.usesCookies || shop.storageBearerTokenKey) {
            const shopCookiesKey = `cookies_${job.data.shop}`
            const shopCookiesExist = await redis.exists(shopCookiesKey)
            const bearerTokenKey = `bearer_token_${job.data.shop}`
            const bearerTokenExist = await redis.exists(bearerTokenKey)

            if ((shop.usesCookies && shopCookiesExist) || (shop.storageBearerTokenKey && bearerTokenExist)) {
              shopCookies = JSON.parse(await redis.get(shopCookiesKey) || '[]')
              bearerToken = await redis.get(bearerTokenKey) || ''
            } else {
              try {
                if (!page) {
                  const currentBrowser: Browser | null = browser
                  const openedBrowser: {
                    isUsingOwnIp: boolean
                    browser: Browser
                    timeout: NodeJS.Timeout | null
                  } = await openBrowser(job.data.shop, figure, currentBrowser)
  
                  isUsingOwnIp = openedBrowser.isUsingOwnIp
                  browser = openedBrowser.browser
                  timeout = openedBrowser.timeout
                  page = await prepareBrowserPage(browser, shop)

                  await redis.incr('localPageCount')
            
                  if (testMode) console.log('New page open, current page count', await redis.get('localPageCount'))
                }

                await getPageContent(page, shop.loginURL || shop.url, shop, figure)

                if (shop.loginURL && shop.loginUsernameSelector && shop.loginPasswordSelector) {
                  try {
                    const usernameInput = await page.waitForSelector(shop.loginUsernameSelector, { timeout: 2000 })
                    const passwordInput = await page.waitForSelector(shop.loginPasswordSelector, { timeout: 2000 })

                    await usernameInput?.evaluate((input, username) => (input as HTMLInputElement).value = username, process.env[`${job.data.shop.toUpperCase()}_USERNAME`] || '')
                    await passwordInput?.evaluate((input, password) => (input as HTMLInputElement).value = password, process.env[`${job.data.shop.toUpperCase()}_PASSWORD`] || '')

                    let hasButton = false

                    if (shop.loginButtonSelector) {
                      const button = await page.waitForSelector(shop.loginButtonSelector, { timeout: 2000 })

                      if (!!button) {
                        hasButton = true

                        await button?.click()
                      }
                    } 
                    
                    if (!hasButton) await page.keyboard.press('Enter')

                    await page.waitForNavigation({ timeout: 5000 })
                  } catch (error) {
                    console.error(`Couldn\'t login at ${shop.loginURL}: ${error}`)
                  }
                }

                // const extractDomain = require('extract-domain')

                // let domain = await extractDomain(shop.url, { tld: true }) as string

                shopCookies = await browser?.cookies() || []

                if (testMode) console.log('Got shop cookies', shopCookies)

                if (shop.storageBearerTokenKey) {
                  bearerToken = await page.evaluate((tokenKey) => {
                    return localStorage.getItem(tokenKey)
                  }, shop.storageBearerTokenKey)

                  if (bearerToken) {
                    if (testMode) console.log('Got bearer token', bearerToken)

                    await redis.set(bearerTokenKey, bearerToken, 'EX', 60 * 60 * 24)
                  }
                }

                // if (domain) shopCookies = (await browser?.cookies() || []).filter(cookie => (cookie.domain.includes(domain)))
              } catch (error) {
                console.error('Can\'t get cookies for shop', job.data.shop, ':', error)
              }

              await redis.set(shopCookiesKey, JSON.stringify(shopCookies), 'EX', shop.cookiesExpiration || 60 * 60 * 24)
            }
          }

          try {
            searchResults = await getAPIResults(shop, figure, search, false, shopCookies, bearerToken || undefined)

            if (shop.retryWithRoute && ((searchResults.length && shop.retryIfResults !== false) || !searchResults.length)) {
              const moreSearchResults = await getAPIResults(shop, figure, search, true, shopCookies, bearerToken || undefined)

              searchResults = [...searchResults, ...moreSearchResults]
            }

            if (!searchResults || !searchResults.length) continue
          } catch (error: any) {
            // await Errors.create({
            //   shop: job.data.shop,
            //   error: error.message,
            //   usingProxy: !isUsingOwnIp
            // })

            errorOccured = true

            continue
          }

          // url = (shop.apiURL || shop.url) + shop.searchRoute

          // const fullUrl = new URL(url)

          // let data = ''

          // switch (shop.method || 'GET') {
          //   case 'GET':
          //     fullUrl.searchParams.append(shop.searchParam || 'search', search)

          //     if (!!shop.params) {
          //       for (let j = 0; j < Object.keys(shop.params || {}).length; j++) {
          //         const param = Object.keys(shop.params || {})[j]
          //         const value = shop.params[param]
  
          //         fullUrl.searchParams.append(param, value)
          //       }
          //     }
        
          //     if (!searchIsJan && shop.replaceParams) {
          //       for (let j = 0; j < shop.replaceParams.length; j++) {
          //         const [term, equalsTo, param, value] = shop.replaceParams[j]
            
          //         if (figure[term] === equalsTo) fullUrl.searchParams.set(param, value)
          //       }
          //     }

          //     const req = await axios.post(fullUrl.toString(),)
          //     const getRes = await req.send()

          //     if (testMode) console.log('getRes', getRes)

          //     if (getRes.response) data = getRes.response

          //     break

          //   case 'POST':
          //     const body = {
          //       [shop.searchParam || 'search']: search,
          //       ...(shop.params || {})
          //     }

          //     if (!searchIsJan && shop.replaceParams) {
          //       for (let j = 0; j < shop.replaceParams.length; j++) {
          //         const [term, equalsTo, param, value] = shop.replaceParams[j]
            
          //         if (figure[term] === equalsTo) body[param] = value
          //       }
          //     }

          //     const postRes = await new RequestBuilder()
          //       .url(fullUrl.toString())
          //       .method('POST')
          //       .headers(shop.headers || {})
          //       .body(body)
          //       .preset({ name: "chrome", version: "116" })
          //       .send()

          //     if (postRes.response) data = postRes.response

          //     break
          // }
        } else if (!!shop.searchRoute) {
          const handleGetPageContent = async (searchUrl: string, searchRoute: string, searchRouteAppend?: ["category" | SearchTerm, string, string][]) => {
            searchUrl += (/\{search\}/.test(searchRoute) ? searchRoute.replace('{search}', search) : searchRoute + search)
          
            if (searchRouteAppend) {
              for (let j = 0; j < searchRouteAppend.length; j++) {
                const [term, equalsTo, stringToAppend] = searchRouteAppend[j]
          
                if (figure[term] === equalsTo) {
                  searchUrl += stringToAppend
  
                  break
                }
              }
            }

            if (/\{category\}/.test(searchUrl)) {
              if (shop.replaceCategory) {
                for (let j = 0; j < shop.replaceCategory.length; j++) {
                  const [term, equalsTo, value] = shop.replaceCategory[j]
            
                  if (figure[term] === equalsTo) {
                    searchUrl = searchUrl.replace('{category}', value)

                    break
                  }
                }
              }

              if (/\{category\}/.test(searchUrl) && shop.defaultCategory) {
                searchUrl = searchUrl.replace('{category}', shop.defaultCategory)
              }
            }

            const urlObject = new URL(searchUrl)
          
            if ((!searchIsJan || shop.checkTitleIfJan) && shop.replaceParams) {
              for (let j = 0; j < shop.replaceParams.length; j++) {
                const [term, equalsTo, param, value] = shop.replaceParams[j]
          
                if (figure[term] === equalsTo) urlObject.searchParams.set(param, value as string)
              }
            }

            searchUrl = urlObject.toString()

            if (shop.decodeURI) searchUrl = decodeURIComponent(searchUrl)

            if (testMode) console.log('Currently searching using url', searchUrl)

            try {
              const redisPageContentsKey = `pageContents_${searchUrl}`

              pageContents = JSON.parse(await redis.get(`pageContents_${searchUrl}`) || '[]')
              
              if (!pageContents || !pageContents.length) {
                if (shop.useCloudflare) {
                  if (testMode) console.log('Fetching page content from Cloudflare.')

                  try {
                    pageContents = await getPageContentFromCloudflare(searchUrl, shop)
                  } catch (error) {
                    console.error(`Error when trying to get page content from cloudflare:`, error)

                    throw new Error('Error when trying to get page content')
                  }
                } else if (job.data.useCloud) {
                  if (testMode) console.log('Fetching page content from the cloud.')

                  try {
                    const data = await getPageContentFromCloud(searchUrl, shop, figure, search)

                    pageContents = data.content
                    url = data.url
                  } catch (error) {
                    console.error(`Error when trying to get page content from the cloud:`, error)

                    throw new Error('Error when trying to get page content')
                  }
                } else {
                  if (testMode) console.log('Fetching page content locally.')

                  // let gotResults = false
                  // let attempts = 0

                  // do {
                    try {
                      if (!page) {
                        const currentBrowser: Browser | null = browser
                        const openedBrowser: {
                          isUsingOwnIp: boolean
                          browser: Browser
                          timeout: NodeJS.Timeout | null
                        } = await openBrowser(job.data.shop, figure, currentBrowser)
        
                        isUsingOwnIp = openedBrowser.isUsingOwnIp
                        browser = openedBrowser.browser
                        timeout = openedBrowser.timeout
                        page = await prepareBrowserPage(browser, shop)
      
                        await redis.incr('localPageCount')
                  
                        if (testMode) console.log('New page open, current page count', await redis.get('localPageCount'))
                      }

                      pageContents = await getPageContent(page, searchUrl, shop, figure, search)

                      // gotResults = true
                    } catch (error: any) {
                      // await page?.screenshot({
                      //   fullPage: true,
                      //   path: `./crawler/screenshots/${job.data.shop}-${error.message.replaceAll(/[^\w\-\s]/g, '')}.png`
                      // })

                      // await Errors.create({
                      //   shop: job.data.shop,
                      //   error: error.message,
                      //   usingProxy: !isUsingOwnIp
                      // })

                      console.error('Error when trying to get page content at', searchUrl, ':', error.message)
                      // console.error('Retrying to get page content at', searchUrl)
                      throw new Error('Error when trying to get page content')

                      // attempts++

                      // if (attempts >= 20) throw new Error('Error when trying to get page content')
                    }
                  // } while (shop.useProxy && !gotResults && attempts < 20)

                  if (page) url = page.url()
                }

                if (!!shop.linkSelector) await redis.set(redisPageContentsKey, JSON.stringify(pageContents), 'EX', shop.cachePageContent ? 60 * 60 * 24 : 60 * 10)
              }
            } catch (error) {
              throw new Error('Error trying to get page contents')
            }
            
            // if (job.data.shop === 'amiami') {
            //   for (let j = 0; j < pageContents.length; j++) {
            //     const pageContent = pageContents[j]
                
            //     try {
            //       if (pageContent) fs.writeFileSync(`./crawler/screenshots/${job.data.shop}-${url.replaceAll(/[^\w\-\s]/g, '')}-before-closing-${new Date().getTime()}.txt`, pageContent)
            //     } catch (error) {
            //       console.error('Couldn\'t write page content of URL', url, 'to file', error)
            //     }
            //   }
            // }
          }

          let searchUrl = shop.url

          try {
            if (searchIsJan && shop.janSearchRoute) {
              await handleGetPageContent(searchUrl, shop.janSearchRoute)
            } else {
              await handleGetPageContent(searchUrl, shop.searchRoute, shop.searchRouteAppend)
            }
          } catch (error) {
            errorOccured = true

            continue
          }

          const resultLimit = (shop.limitNonJANResults && !barcodeRegex.test(search)) || !shop.limitNonJANResults ? shop.resultLimit : undefined

          searchResults = pageContents.flatMap(pageContent => (getResults(pageContent, shop, url, figure) || []).slice(0, resultLimit))

          if (shop.retryWithRoute) {
            try {
              await handleGetPageContent(searchUrl, shop.retryWithRoute, shop.searchRouteAppend)
            } catch (error) {
              errorOccured = true

              continue
            }
          }

          searchResults = [...searchResults, ...pageContents.flatMap(pageContent => (getResults(pageContent, shop, url, figure) || []).slice(0, resultLimit))]

          if (testMode) console.log('Found', searchResults.length, 'potential results for search', searchUrl)
        }

        const filteredResults = []

        for (let j = 0; j < searchResults.length; j++) {
          const result = searchResults[j]

          if (shop.isRegionLocked) {
            result.isDomesticShippingOnly = true

            if (shop.notAvailableSelector) {
              try {
                if (!page) {
                  const currentBrowser: Browser | null = browser
                  const openedBrowser: {
                    isUsingOwnIp: boolean
                    browser: Browser
                    timeout: NodeJS.Timeout | null
                  } = await openBrowser(job.data.shop, figure, currentBrowser)
  
                  isUsingOwnIp = openedBrowser.isUsingOwnIp
                  browser = openedBrowser.browser
                  timeout = openedBrowser.timeout
                  page = await prepareBrowserPage(browser, shop)
  
                  await redis.incr('localPageCount')
              
                  if (testMode) console.log('New page open, current page count', await redis.get('localPageCount'))
                }

                await page.goto(url, { waitUntil: shop.waitUntil || 'networkidle0' })

                const pageContent = await page.content()

                const $ = cheerio.load(pageContent)

                result.isDomesticShippingOnly = !!$(shop.notAvailableSelector).get()[0]
              } catch (error) {
                result.isDomesticShippingOnly = false
              }
            }
          }

          if (shop.visitResults) {
            try {
              let pageContent: any = null

              if (shop.useCloudflare) {
                if (testMode) console.log('Fetching page content from Cloudflare.')

                try {
                  pageContent = (await getPageContentFromCloudflare(result.url, shop))[0]
                } catch (error) {
                  console.error(`Error when trying to get page content from cloudflare:`, error)

                  throw new Error('Error when trying to get page content from cloudflare')
                }
              } else {
                if (!page) {
                  const currentBrowser: Browser | null = browser
                  const openedBrowser: {
                    isUsingOwnIp: boolean
                    browser: Browser
                    timeout: NodeJS.Timeout | null
                  } = await openBrowser(job.data.shop, figure, currentBrowser)
      
                  isUsingOwnIp = openedBrowser.isUsingOwnIp
                  browser = openedBrowser.browser
                  timeout = openedBrowser.timeout
                  page = await prepareBrowserPage(browser, shop)
    
                  await redis.incr('localPageCount')
              
                  if (testMode) console.log('New page open, current page count', await redis.get('localPageCount'))
                }
    
                pageContent = (await getPageContent(page, result.url, shop, figure, search))[0]
              }

              const $ = cheerio.load(pageContent)
  
              if (shop.visitResultsInStockSelector) {
                const node = $(shop.visitResultsInStockSelector).get()[0]
    
                if (!node) {
                  if (testMode) console.log(`Result visited but in-stock selector ${shop.visitResultsInStockSelector} was absent, skipping`)

                  continue
                }
              }
  
              if (shop.visitResultsResultSelector) {
                const node = $(shop.visitResultsResultSelector).get()[0]
    
                if (!isRightItem($, node, shop.checkTerms, shop.termsLang, figure)) {
                  if (testMode) console.log(`Result visited but selector ${shop.visitResultsResultSelector} seems to indicate the wrong item, skipping`)

                  continue
                }
              }

              if (shop.visitResultsPriceSelector) {
                const node = $(shop.visitResultsPriceSelector).get()[0]
                const priceText = $(node).text().trim() || ''

                if (priceText) {
                  if (testMode) console.log(`Result visited and selector ${shop.visitResultsPriceSelector} found new price: ${priceText}`)

                  result.price = priceText
                }
              }
            } catch (error) {
              console.error('Couldn\'t visit result at url', result.url, error)

              throw new Error('Error trying to visit result')
            }
          }

          const isWrongResult = await isBlacklisted(result, figure, shop)

          if (isWrongResult) {
            if (testMode) console.log('Result has previously been found wrong, skipping.')

            continue
          }

          if (job.data.options && job.data.options.mustContain) {
            const hasTermsToInclude = job.data.options.mustContain.filter((termToInclude: string) => result.title.toLowerCase().includes(termToInclude.toLowerCase())).length === job.data.options.mustContain.length

            if (!hasTermsToInclude) {
              if (testMode) console.log('Title', result.title, 'lacks a required term, skipping.')

              continue
            }
          }

          if (job.data.options && job.data.options.exclude) {
            const hasTermToExclude = job.data.options.exclude.filter((termToExclude: string) => result.title.toLowerCase().includes(termToExclude.toLowerCase())).length > 0

            if (hasTermToExclude) {
              if (testMode) console.log('Title', result.title, 'contains terms to exclude, skipping.')

              continue
            }
          } else {
            const { 0: barcode } = (barcodeRegex.exec(result.url) || [])

            if (!!barcode && searchIsJan && shop.checkUrlIfJan) {
              const jans = searches.filter(searchToTest => barcodeRegex.test(searchToTest))

              if (!jans.includes(barcode)) {
                if (testMode) console.log('URL', result.url, 'does not contain the correct JAN', search, ', skipping.')

                continue
              }
            } else if (!searchIsJan || shop.checkTitleIfJan) {
              const termsForSearches: SearchTerm[] = shop.stringSimilarity || ['classification', 'origin', 'char', 'title', 'version', 'manufacturer', 'distributor', 'classification']
              const references = await getSearches(termsData, termsForSearches, figure, shop)
              const titleChecked = await checkTitle(result.title, figure, shop, references)

              if (!titleChecked) {
                if (testMode) console.log('Title', result.title, 'has not passed the check, skipping.')

                continue
              }
            }
          }

          result.isAccurate = shop.isAccurate ? true : searchIsJan
          result.searchUsed = search

          filteredResults.push(result)
        }

        results = [...results, ...filteredResults]

        const hasResults = !!results && !!results.length
        const nextSearch = searches[i + 1]
        const nextSearchIsKeywords = !!nextSearch && !barcodeRegex.test(nextSearch)
        const alreadySearchedWithKeywordsOrDontNeedToRetry = !shop.retryIfResults || !barcodeRegex.test(search)

        if (
          hasResults &&
          nextSearchIsKeywords &&
          alreadySearchedWithKeywordsOrDontNeedToRetry
        ) break

        // if (!!browser) {
        //   if (shop.clearCookiesBetweenSearches) await browser.deleteCookie(...(await browser.cookies()))

        //   if (timeout) clearTimeout(timeout)
        
        //   if (isUsingOwnIp) {
        //     await redis.del(`ownIp_${job.data.shop}`)
        //     if (testMode) console.log('Deleted redis key for own IP use in shop', shop, ':', await redis.get(`ownIp_${job.data.shop}`))
        //     await page?.close()
        //   } else {
        //     await browser?.close()
        //   }
        // }

        if (shop.waitBetweenSearches) {
          await new Promise(resolve => setTimeout(resolve, shop.waitBetweenSearches))
        }
      }
      
      if (!errorOccured && (!results || !results.length) && shop.noHitShop) {
        const latestRelease = figure.releases.find(release => !!release.date)
        const now = new Date()

        if (!latestRelease || (latestRelease.date && (figureReleaseDate(latestRelease.date).getTime() + TWO_MONTHS) < now.getTime())) {
          if (testMode) console.log('No results found for figure', figure._id.toString(), 'and shop', job.data.shop, 'doesn\'t restock, creating no hit entry.')

          await NoHits.create({ figure: figure._id, shop: job.data.shop })
        }
      }

      if (testMode) console.log('Found', results.length, 'results for figure', figure._id.toString(), 'in shop', job.data.shop)

      return results
    } catch (error: any) {
      console.error(error)

      throw new Error(error)
    } finally {
      await cleanup(job.data.shop, isUsingOwnIp, page, browser, timeout)
    }
  }

  const listingsHandler = async (job: Job<ListingWorkerJob>) => {
    const { listing, shop } = job.data
    const shopInfo = shops[shop]

    let browser: Browser | null = null
    let isUsingOwnIp = false
    let timeout: NodeJS.Timeout | null = null
    let page: Page | null = null

    const figure = await Figures.findById(listing.figure)
    const redisPageContentKey = `pageContent_${listing.url}`

    let pageContent = await redis.get(redisPageContentKey) || ''
  
    if (!pageContent) {
      if (shopInfo.useCloudflare) {
        try {
          pageContent = (await getPageContentFromCloudflare(listing.url, shopInfo))[0]
        } catch (error: any) {
          // await page?.screenshot({
          //   fullPage: true,
          //   path: `./crawler/screenshots/${job.data.shop}-${error.message.replaceAll(/[^\w\-\s]/g, '')}.png`
          // })

          // await Errors.create({
          //   shop: job.data.shop,
          //   error: error.message,
          //   usingProxy: !isUsingOwnIp
          // })

          console.error(error)

          throw new Error(error)
        }
      } else {
        try {
          const openedBrowser: {
            isUsingOwnIp: boolean
            browser: Browser
            timeout: NodeJS.Timeout | null
          } = await openBrowser(shop, figure)

          browser = openedBrowser.browser
          isUsingOwnIp = openedBrowser.isUsingOwnIp
          timeout = openedBrowser.timeout

          page = await prepareBrowserPage(browser, shopInfo)

          await redis.incr('localPageCount')
      
          // console.log('New page open, current page count', await redis.get('localPageCount'))

          pageContent = (await getPageContent(page, listing.url, shopInfo, figure))[0]
        } catch (error: any) {
          // await page?.screenshot({
          //   fullPage: true,
          //   path: `./crawler/screenshots/${job.data.shop}-${error.message.replaceAll(/[^\w\-\s]/g, '')}.png`
          // })

          // await Errors.create({
          //   shop: job.data.shop,
          //   error: error.message,
          //   usingProxy: !isUsingOwnIp
          // })

          console.error(error)

          throw new Error(error)
        } finally {
          await cleanup(job.data.shop, isUsingOwnIp, page, browser, timeout)
        }
      }
    }

    await redis.set(redisPageContentKey, pageContent, 'EX', 60 * 10)

    if (!pageContent) return null

    const $ = cheerio.load(pageContent)

    // if ((!shopInfo.checkSoldOutSelectors || !shopInfo.checkSoldOutSelectors.length) && (!shopInfo.checkInStockSelectors || !shopInfo.checkInStockSelectors.length)) {
    //   onComplete(await updatePrice($, listing, shopInfo), timeout)

    //   return
    // }

    if (shopInfo.checkSoldOutSelectors) {
      for (let i = 0; i < shopInfo.checkSoldOutSelectors.length; i++) {
        const [selector, textToCheck] = shopInfo.checkSoldOutSelectors[i]
        const nodeToCheck = $(selector)
        const soldOutNodeIsNotPresent = !nodeToCheck || !nodeToCheck.length
  
        if (soldOutNodeIsNotPresent) continue
  
        if (!textToCheck) {
          // console.log('Sold out element present in shop', shop, 'for listing', listing.url, ', skipping.')

          return null
        }
  
        const nodeTextContent = nodeToCheck.text()
        const nodeContainsText = !!nodeTextContent && nodeTextContent.includes(textToCheck)
  
        if (!nodeContainsText) continue

        // console.log('Element containing text indicating item is out of stock in shop', shop, 'for listing', listing.url, 'has been found, skipping.')

        return null
      }
    }

    if (shopInfo.checkInStockSelectors) {
      for (let i = 0; i < shopInfo.checkInStockSelectors.length; i++) {
        const [selector, textToCheck] = shopInfo.checkInStockSelectors[i]
        const nodeToCheck = $(selector)
        const inStockNodeIsNotPresent = !nodeToCheck || !nodeToCheck.length
  
        if (inStockNodeIsNotPresent) continue
  
        if (!textToCheck) {
          // console.log('In stock element present in shop', shop, 'for listing', listing.url, ', confirming.')
        
          const updatedListing = await updatePrice($, listing, shopInfo)

          return updatedListing
        }
  
        const nodeTextContent = nodeToCheck.text()
        const nodeContainsText = !!nodeTextContent && nodeTextContent.includes(textToCheck)
  
        if (!nodeContainsText) continue

        // console.log('Element containing text indicating item is in stock in shop', shop, 'for listing', listing.url, 'has been found, confirming.')
        
        const updatedListing = await updatePrice($, listing, shopInfo)

        return updatedListing
      }

      // console.log('No elements indicating item is in stock in shop', shop, 'for listing', listing.url, 'has been found, skipping.')

      return null
    }

    // console.log('No elements indicating item is out of stock in shop', shop, 'for listing', listing.url, 'has been found, confirming.')

    const updatedListing = await updatePrice($, listing, shopInfo)

    return updatedListing
  }

  const figuresHandler = async (job: Job<FigureWorkerJob>) => {
    const link = job.data.mfcLink
    const shop = 'mfc'

    let browser: Browser | null = null
    let isUsingOwnIp = true
    let timeout: NodeJS.Timeout | null = null
    let page: Page | null = null

    try {
      const openedBrowser: {
        isUsingOwnIp: boolean
        browser: Browser
        timeout: NodeJS.Timeout | null
      } = await openBrowser(shop, undefined)
      
      if (!openedBrowser.browser) throw new Error('No browser when trying to get figure info')
    
      browser = openedBrowser.browser
      timeout = openedBrowser.timeout
      page = await prepareBrowserPage(browser, shops['mfc'])

      await redis.incr('localPageCount')

      // console.log('New page open, current page count', await redis.get('localPageCount'))

      await mfcSignIn(page)

      let gotoRetries = 0
  
      do {
        gotoRetries++

        try {
          await page.goto(link, {
            waitUntil: 'domcontentloaded'
          })
  
          break
        } catch (error) {
          console.error('Error trying to go to figure MFC page', link, ':', error)
        }
      } while (gotoRetries < 3)

      if (gotoRetries >= 3) throw new Error(`Too many attempts trying to go to ${link}`)

      await page.waitForSelector('#wide .data', { timeout: 4000 })

      const figureInfo: FigureInfos = {
        name: '',
        category: '',
        title: '',
        char: '',
        chars: [],
        origin: '',
        version: '',
        classification: '',
        numbering: '',
        manufacturer: '',
        distributor: '',
        sculptor: '',
        image: '',
        images: [],
        scale: '',
        mfcLink: '',
        releases: [],
        jp: {
          title: '',
          char: '',
          version: '',
          origin: '',
          manufacturer: '',
          distributor: '',
          classification: ''
        }
      }
  
      figureInfo.mfcLink = page.url()
  
      let pageContent = await page.content()
      let $ = cheerio.load(pageContent)
  
      if (await page.$('a.disclaimer')) await page.click('a.disclaimer')
  
      if (await page.$('.item-picture .tbx-pswp')) {
        try {
          await page.waitForSelector('.item-picture .tbx-pswp', { timeout: 2000 })
          await page.click('.item-picture .tbx-pswp')
  
          const imageElement = await page.waitForSelector('.pswp > .pswp__scroll-wrap > .pswp__container > .pswp__item:nth-child(2) img.pswp__img', { timeout: 2000 })
  
          let figureImageSrc = await imageElement?.evaluate(el => el.src)
  
          if (!figureImageSrc) throw new Error('No image')
  
          figureInfo.image = imageSrcRegex.test(figureImageSrc) ? (figureImageSrc || '') : ''
          figureInfo.images = []
  
          // let imageSrc: string | undefined = figureImageSrc
          // let index = 2
  
          // do {
          //   if (imageSrc && imageSrcRegex.test(imageSrc)) figureInfo.images.push(imageSrc)
  
          //   try {
          //     await page.waitForSelector('button.pswp__button--arrow--right', { timeout: 1000 })
          //     await page.click('button.pswp__button--arrow--right')
  
          //     const nextImageElement = await page.waitForSelector(`.pswp__item:nth-child(${(index % 3) + 1}) img.pswp__img`, { timeout: 1000 })
  
          //     imageSrc = await nextImageElement?.evaluate(el => el.src)            
          //   } catch (error) {
          //     console.error('Error when getting the figure\'s addtional image', error)
          //   }
  
          //   index++
          // } while (!!imageSrc && imageSrc !== figureImageSrc)
  
          await page.keyboard.press('Escape')
        } catch (error) {
          console.error('Error when getting the figure\'s image', error)
        }
      }
  
      figureInfo.name = $("#content > div.content-header > div > div.content-headline > h1.title").text() || ''
  
      let offset = 0
  
      const hasCategory = $("#wide .data .data-field:nth-child(1) .data-label").text().includes('Category')
  
      if (hasCategory) {
        figureInfo.category = $('#wide .data .data-field:nth-child(1) .data-value').text().replace(/\([^\(\)]+\)/, '').trim()
  
        // console.log('Got category', figureInfo.category, 'in page', figureInfo.mfcLink)
  
        offset++
      }
  
      const hasClassification = $(`#wide .data .data-field:nth-child(${1 + offset}) .data-label`).text().includes('Classification')
  
      if (hasClassification) {
        const classifications = $(`#wide .data .data-field:nth-child(${1 + offset}) .data-value a`).map(function () { return $(this).text().replace(/\([^\(\)]+\)/, '').trim() }).toArray()
  
        figureInfo.classification = classifications.reverse().reduce((classification, curr) => classification.includes(curr) ? classification : classification + ', ' + curr, classifications[0] || '')
  
        // console.log('Got classification', figureInfo.classification, 'in page', figureInfo.mfcLink)
  
        offset++
      }
  
      const hasNumbering = $(`#wide .data .data-field:nth-child(${1 + offset}) .data-label`).text().includes('Numbering')
  
      if (hasNumbering) {
        figureInfo.numbering = $(`#wide .data .data-field:nth-child(${1 + offset}) .data-value`).text().replace(/\([^\(\)]+\)/, '').trim()
  
        // console.log('Got numbering', figureInfo.numbering, 'in page', figureInfo.mfcLink)
  
        offset++
      }
  
      const hasTitle = $(`#wide .data .data-field:nth-child(${1 + offset}) .data-label`).text().includes('Title')
  
      if (hasTitle) {
        figureInfo.title = $(`#wide .data .data-field:nth-child(${1 + offset}) a`).text().replace(/\([^\(\)]+\)/, '').trim()
  
        // console.log('Got title', figureInfo.title, 'in page', figureInfo.mfcLink)
  
        offset++
      }
  
      const hasOrigin = $(`#wide .data .data-field:nth-child(${1 + offset}) .data-label`).text().includes('Origin')
  
      if (hasOrigin) {
        const originEls = $(`#wide .data .data-field:nth-child(${1 + offset}) a`).get()
        const originNames = originEls.map(element => $(element).text().replace(/\([^\(\)]+\)/, '').trim())
        const originLinks = originEls.map(element => 'https://myfigurecollection.net' + $(element).attr('href'))
        
        for (let i = 0; i < originLinks.length; i++) {
          const originName = originNames[i]
          const originLink = originLinks[i]
  
          if (originName && originLink) await getOriginAltNames(page, originName, originLink)
        }
  
        figureInfo.origin = originNames.join(', ')
  
        // console.log('Got origin', figureInfo.origin, 'in page', figureInfo.mfcLink)
  
        offset++
      }
  
      const hasCharacter = $(`#wide .data .data-field:nth-child(${1 + offset}) .data-label`).text().includes('Character')
  
      if (hasCharacter) {
        const charEls = $(`#wide .data .data-field:nth-child(${1 + offset}) a`).get()
        const charNames = charEls.map(element => $(element).text().replace(/\([^\(\)]+\)/, '').trim())
        const charLinks = charEls.map(element => 'https://myfigurecollection.net' + $(element).attr('href'))
        
        for (let i = 0; i < charLinks.length; i++) {
          const charLink = charLinks[i]
          const char: Character = await getCharAltNames(page, charLink)
  
          if (figureInfo.chars && char) figureInfo.chars.push(char._id)
        }
  
        figureInfo.char = charNames.join(', ')
  
        // console.log('Got char', figureInfo.char, 'in page', figureInfo.mfcLink)
  
        offset++
      } else {
        figureInfo.char = figureInfo.title || ''
      }
  
      const companies = $(`#wide .data .data-field:nth-child(${1 + offset}) .data-value .item-entries`).get().map(company => $(company).text())
      const manufacturer = companies.filter(company => /Manufacturer/.test(company))[0] || ''
      const distributor = companies.filter(company => /Distributor/.test(company))[0] || ''
      const circle = companies.filter(company => /Circle/.test(company))[0] || ''
  
      figureInfo.manufacturer = ((manufacturer || circle) || companies[0]).replace(/as .+/, '').trim()
      figureInfo.distributor = distributor?.replace(/as .+/, '').trim()
  
      // console.log('Got manufacturer', figureInfo.manufacturer, 'in page', figureInfo.mfcLink)
      // console.log('Got distributor', figureInfo.distributor, 'in page', figureInfo.mfcLink)
  
      const hasArtists = $(`#wide .data .data-field:nth-child(${2 + offset}) .data-label`).text().includes('Artist')
  
      if (hasArtists) {
        const artists = $(`#wide .data .data-field:nth-child(${2 + offset}) .data-value .item-entries`).get().map(artist => $(artist).text())
        const sculptor = artists.filter(artist => /Sculptor/.test(artist))[0]
  
        figureInfo.sculptor = sculptor?.replace(/as .+/, '').trim()
  
        // console.log('Got sculptor', figureInfo.sculptor, 'in page', figureInfo.mfcLink)
  
        offset++
      }
  
      const hasVersion = $(`#wide .data .data-field:nth-child(${2 + offset}) .data-label`).text().includes('Version')
  
      if (hasVersion) {
        figureInfo.version = $(`#wide .data .data-field:nth-child(${2 + offset}) .data-value`).text().replace(/[\,\(\)]/g, '').trim()
  
        // console.log('Got version', figureInfo.version, 'in page', figureInfo.mfcLink)
  
        offset++
      }
  
      const hasRelease = $(`#wide .data .data-field:nth-child(${(2 + offset)}) .data-label`).text().includes('Release')
  
      if (hasRelease) {
        let counter = 0
  
        do {
          const priceRaw = ($(`#wide .data .data-field:nth-child(${(2 + offset)}) .data-value`).text().match(/([0-9]{1,3}\,)*[0-9]{1,3}(\.[0-9]{2})?\s[A-Z]{3}/) || [''])[0]
          const currency = priceRaw ? getCurrency(priceRaw) : 'JPY'
          const price = priceRaw ? parseFloat(priceRaw.replace(/[A-Z\,\s]/g, '')) : undefined
          const date = $(`#wide .data .data-field:nth-child(${(2 + offset)}) a.time`).text().trim()
          // const date = dateArray.length === 3 ? `${dateArray[2]}/${dateArray[0]}/${dateArray[1]}` : `${dateArray[1] || '01'}/${dateArray[0]}`
          const jan = ($(`#wide .data .data-field:nth-child(${(2 + offset)}) .data-value meta[itemprop="productID"]`).attr('content')?.match(barcodeRegex) || [])[0]
  
          figureInfo.releases.push({ date, price, currency, jan })
  
          offset++
          counter++
        } while (!!$(`#wide .data .data-field:nth-child(${2 + offset}) .data-value`).text() && !$(`#wide .data .data-field:nth-child(${2 + offset}) .data-label`).text() && counter < 10)
  
        // console.log('Got releases', figureInfo.releases, 'in page', figureInfo.mfcLink)
      }
  
      figureInfo.scale = $('#wide .data .data-value > a.item-scale').text().trim()
  
      if (!figureInfo.scale && !figureInfo.classification) figureInfo.scale = "Non Scale"
  
      // console.log('Got scale', figureInfo.scale, 'in page', figureInfo.mfcLink)
  
      let counter = 0
  
      do {
        counter++
  
        await page.click('a.item-switch-alphabet')
  
        pageContent = await page.content()
        $ = cheerio.load(pageContent)
      } while (!jpRegex.test($('#wide .data').text()) && counter < 20)
  
      if (counter >= 20) {
        console.error('Couldn\'t get japanese infos')
  
        return figureInfo
      }
  
      offset = 0
  
      if (hasCategory) offset++
  
      if (hasClassification) {
        const jpClassifications = $(`#wide .data .data-field:nth-child(${1 + offset}) .data-value a`).map(function () { return $(this).text().replace(/\([^\(\)]+\)/, '').trim() }).toArray()
  
        figureInfo.jp.classification = jpClassifications.reverse().reduce((classification, curr) => classification.includes(curr) ? classification : classification + ', ' + curr, jpClassifications[0] || '')
  
        offset++
      }
  
      if (hasTitle) {
        figureInfo.jp.title = $(`#wide .data .data-field:nth-child(${1 + offset}) a`).text().replace(/\([^\(\)]+\)/, '').trim()
  
        offset++
      }
  
      if (hasOrigin) {
        figureInfo.jp.origin = $(`#wide .data .data-field:nth-child(${1 + offset}) a`).text().trim()
  
        offset++
      }
  
      if (hasCharacter) {
        figureInfo.jp.char = $(`#wide .data .data-field:nth-child(${1 + offset}) a`).text().replace(/\([^\(\)]+\)/, '').trim()
  
        offset++
      } else {
        figureInfo.jp.char = figureInfo.jp.title || ''
      }
  
      const companiesJp = $(`#wide .data .data-field:nth-child(${1 + offset}) .data-value .item-entries`).get().map(company => $(company).text())
      const manufacturerJp = companiesJp.filter(company => /Manufacturer/.test(company))[0] || ''
      const distributorJp = companiesJp.filter(company => /Distributor/.test(company))[0] || ''
      const circleJp = companiesJp.filter(company => /Circle/.test(company))[0]
  
      figureInfo.jp.manufacturer = ((manufacturerJp || circleJp) || companiesJp[0]).replace(/as .+/, '').trim()
      figureInfo.jp.distributor = distributorJp?.replace(/as .+/, '').trim()
  
      if (hasArtists) {
        const artists = $(`#wide .data .data-field:nth-child(${2 + offset}) .data-value .item-entries`).get().map(artist => $(artist).text())
        const sculptor = artists.filter(artist => /Sculptor/.test(artist))[0]
  
        figureInfo.jp.sculptor = sculptor?.replace(/as .+/, '').trim()
  
        offset++
      }
  
      if (hasVersion) {
        figureInfo.jp.version = $(`#wide .data .data-field:nth-child(${2 + offset}) .data-value`).text().replace(/[\,\(\)]/g, '').trim()
  
        offset++
      }
  
      for (let i = 0; i < Object.keys(figureInfo.jp).length; i++) {
        const dataKey = Object.keys(figureInfo.jp)[i]
        const patterns = doNotTranslate[dataKey]
  
        if (!patterns || !patterns.length) continue
  
        const data = figureInfo[dataKey as keyof FigureData] || ''
  
        if (patterns.find(pattern => pattern.test(data))) figureInfo.jp[dataKey as keyof FigureData] = data
      }
  
      return figureInfo
    } catch (error) {
      console.error('Error when scraping for figure infos', error)
  
      throw new Error('Error when scraping for figure infos')
    } finally {
      await cleanup('mfc', isUsingOwnIp, page, browser, timeout)
    }
  }

  const mfcLinksHandler = async (job: Job<MfcLinkWorkerJob>) => {
    const jan = job.data.jan
    const searchUrl = `https://myfigurecollection.net/browse.v4.php?barcode=${jan}`

    let browser: Browser | null = null
    let isUsingOwnIp = true
    let timeout: NodeJS.Timeout | null = null
    let page: Page | null = null

    try {
      const openedBrowser: {
        isUsingOwnIp: boolean
        browser: Browser
        timeout: NodeJS.Timeout | null
      } = await openBrowser('mfc', undefined)

      browser = openedBrowser.browser
      timeout = openedBrowser.timeout
      page = await prepareBrowserPage(browser, shops.mfc)

      await redis.incr('localPageCount')

      // console.log('New page open, current page count', await redis.get('localPageCount'))

      await mfcSignIn(page)

      let gotoRetries = 0
  
      do {
        gotoRetries++

        try {
          await page.goto(searchUrl, {
            waitUntil: 'domcontentloaded'
          })
  
          break
        } catch (error) {
          console.error('Error trying to go to figure MFC page', searchUrl, ':', error)
        }
      } while (gotoRetries < 3)

      if (gotoRetries >= 3) throw new Error(`Too many attempts trying to go to ${searchUrl}`)

      // console.log('Current page:', page.url())
  
      try {
        try {
          await page.waitForSelector('#wide .data', { timeout: 2000 })
        } catch {
          console.error('Can\'t find the data element')
  
          await page.waitForSelector('#content .results > .result .item-icon > a', { timeout: 2000 })
        }
      } catch (error) {
        console.error('JAN', jan, 'can\'t be found on MFC.')

        return ''
      }
  
      let link = page.url()
  
      if (!mfcLinkRegex.test(link)) {
        const pageContent = await page.content()
        const $ = cheerio.load(pageContent)
        const figureRoute = $("#content .results > .result .item-icon > a").attr("href")?.trim()
  
        link = `https://myfigurecollection.net${figureRoute}`
  
        if (!mfcLinkRegex.test(link)) {
          console.error('JAN', jan, 'can\'t be found on MFC.')
  
          return ''
        } else {
          await page.goto(link, { waitUntil: 'domcontentloaded' })
        }
      }
  
      // console.log('Found a MFC link for', jan, ':', link)
  
      return link
    } catch (error) {
      console.error('Error when scraping for figure\'s MFC link with JAN', jan, ':', error)
  
      throw new Error('Error when scraping for figure\'s MFC link')
    } finally {
      await cleanup('mfc', isUsingOwnIp, page, browser, timeout)
    }
  }

  const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD
  }

  const workerOptions: WorkerOptions = {
    connection,
    concurrency: 6
  }

  const figuresWorkerOptions: WorkerOptions = {
    connection,
    concurrency: 1
  }

  const mfcLinksWorkerOptions: WorkerOptions = {
    connection,
    concurrency: 1
  }

  const workers: { [key: string]: Worker } = {}

  for (const shop in shops) {
    if (Object.prototype.hasOwnProperty.call(shops, shop)) {
      const queueName = `${shop}Queue`
      
      workers[shop] = new Worker(queueName, workerHandler, workerOptions)
      workers[shop].on('error', err => {
        console.error(err)
      })
      workers[shop].on('failed', err => {
        console.error(err)
      })
    }
  }

  const listingsWorker = new Worker('listingsQueue', listingsHandler, workerOptions)

  listingsWorker.on('error', err => {
    console.error(err)
  })

  listingsWorker.on('failed', err => {
    console.error(err)
  })

  const figuresWorker = new Worker('figuresQueue', figuresHandler, figuresWorkerOptions)

  figuresWorker.on('error', err => {
    console.error(err)
  })

  figuresWorker.on('failed', err => {
    console.error(err)
  })

  const mfcLinksWorker = new Worker('mfcLinksQueue', mfcLinksHandler, mfcLinksWorkerOptions)

  mfcLinksWorker.on('error', err => {
    console.error(err)
  })

  mfcLinksWorker.on('failed', err => {
    console.error(err)
  })

  console.log('Worker ready')
})()

