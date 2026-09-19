import type { CookieData, Page } from 'rebrowser-puppeteer'
import mfcCookieBannerClicker from "./mfcCookieBannerClicker"
import redis from "./redisClient"

const ONE_WEEK = 60 * 60 * 24 * 7

export async function mfcSignIn (page: Page) {
  return

  const mfcAuthRedisKey = `mfcAuthCookies`

  try {
    if (await redis.exists(mfcAuthRedisKey)) {
      const cookies: CookieData[] = JSON.parse(await redis.get(mfcAuthRedisKey) || '[]')
      const browser = await page.browser()

      await browser.setCookie(...cookies)

      return
    }
  } catch (error) {
    console.error('Error trying to set MFC cookies', error)
  }

  try {
    await page.goto('https://myfigurecollection.net/session/signin/', { waitUntil: 'domcontentloaded' })

    try {
      const profile = await page.waitForSelector('.user-menu a.handle', { timeout: 2000 })
      const profileElementProperty = await profile?.getProperty('href')

      if (!profileElementProperty || /\/session\/signin\//.test((await profileElementProperty?.toString()) || '')) throw new Error('Not yet signed into MFC')

      // console.log('Already signed into MFC')

      return
    } catch (error) {
      // console.log('Not yet signed into MFC')
    }

    await mfcCookieBannerClicker(page)
  
    // try {
    //   await page.waitForSelector('h2#LXXt3', { timeout: 2000 })
    //   await page.waitForTimeout(3000)
    //   await page.mouse.click(533, 294)
    //   await page.waitForNavigation({ timeout: 4000 })
    // } catch (error) {
      
    // }
  
    const usernameEl = await page.waitForSelector('input[name="username"]', { timeout: 1000 })
    const passwordEl = await page.waitForSelector('input[name="password"]', { timeout: 1000 })
  
    await usernameEl?.type(process.env.MFC_USERNAME || '')
    await passwordEl?.type(process.env.MFC_PASSWORD || '')
  
    await passwordEl?.press('Enter')
  
    await page.waitForNavigation()

    const browser = await page.browser()
    const cookies = (await browser.cookies()).filter(cookie => /myfigurecollection\.net/.test(cookie.domain))
    const redisKey = `mfcAuthCookies`
  
    await redis.set(redisKey, JSON.stringify(cookies), 'EX', ONE_WEEK)
  } catch (error) {
    console.error('Couldn\'t sign into MFC', error)
  }
}

export async function mfcSignOut (page: Page) {
  await page.goto('https://myfigurecollection.net/session/signout/', { waitUntil: 'domcontentloaded' })
}
