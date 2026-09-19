import { Browser, Page } from 'rebrowser-puppeteer'
import { Shop } from "../../types/Shops"
import { PuppeteerBlocker } from '@ghostery/adblocker-puppeteer'
import UserAgent from 'user-agents'

export default async function prepareBrowserPage (browser: Browser, shop?: Shop) {
  try {
    if (shop?.cookies) await browser.setCookie(...shop.cookies)

    const page = (await browser.pages())[0]
    const blocker = await PuppeteerBlocker.fromPrebuiltAdsAndTracking()
    
    await blocker.blockImages()
    await blocker.blockFonts()
    await blocker.blockStyles()

    // @ts-ignore
    if (shop?.stealthy !== false) await blocker.enableBlockingInPage(page)
  
    // if (shop?.hideAgent) {
      const userAgent = new UserAgent({ deviceCategory: 'desktop' })

      await page.setUserAgent(userAgent.random().toString())
    // } else {
    //   await page.setUserAgent('buyfinder-bot (https://buyfinder.moe/about)')
    // }
    // await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36')
    await page.setExtraHTTPHeaders({
      'accept-language': 'en-US,en;q=0.8',
      // 'sec-ch-ua': '"Brave";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      // 'sec-ch-ua-mobile': '?0',
      // 'sec-ch-ua-platform': '"Windows"',
      // 'sec-fetch-dest': 'empty',
      // 'sec-fetch-mode': 'cors',
      // 'sec-fetch-site': 'same-origin',
      // 'sec-gpc': '1',
      ...(shop?.headers || {})
    })

    // if (shop?.stealthy !== false) {
    //   await page.evaluateOnNewDocument(() => {
    //     const getParameter = WebGLRenderingContext.prototype.getParameter
  
    //     WebGLRenderingContext.prototype.getParameter = function(param) {
    //       // UNMASKED_VENDOR_WEBGL
    //       if (param === 37445) return 'Intel Inc.'
  
    //       // UNMASKED_RENDERER_WEBGL
    //       if (param === 37446) return 'Intel Iris OpenGL Engine'
  
    //       return getParameter.call(this, param)
    //     }
    //   })
    // }

    // console.log('Opened new page with user-agent', await page.evaluate(() => navigator.userAgent))
  
    return page
  } catch (error) {
    console.error('Couldn\'t prepare the browser page: ', error)

    throw new Error('Couldn\'t prepare the browser page')
  }
}
