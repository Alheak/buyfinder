import { Page, ElementHandle } from 'rebrowser-puppeteer'

export default async function mfcCookieBannerClicker (page: Page) {
  try {
    let retries = 0

    while (retries < 2) {
      retries++

      const cookieBannerButton = await page.waitForSelector('.css-47sehv', { timeout: 2000 }) as ElementHandle<HTMLElement> | null
  
      if (cookieBannerButton) {
        await cookieBannerButton?.evaluate((button) => button.click())

        break
      }
    }
  } catch (error) {
    console.error('Couldn\'t click the cookie banner')
  }
}
