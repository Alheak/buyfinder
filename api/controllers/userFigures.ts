import puppeteer from 'rebrowser-puppeteer'
import browserOptions from '../../crawler/utils/browserOptions'
import Figures from "../models/Figure"
import mfcCookieBannerClicker from "../utils/mfcCookieBannerClicker"

export async function getFiguresFromMfcUsername (username: string) {
  const browser = await puppeteer.launch(browserOptions)

  try {
    const page = await browser.newPage()
    const url = `https://myfigurecollection.net/users.v4.php?mode=view&username=${username}&tab=collection&rootId=0`

    await page.goto(url, { waitUntil: 'domcontentloaded' })

    await mfcCookieBannerClicker(page)

    const mfcLinks = []

    while (true) {
      const results = await page.$$('#wide .results > .result > .item-icons > .item-icon > a')

      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        const mfcItemRoute = await result.evaluate(element => element.href)
        const mfcLink = `https://myfigurecollection.net${mfcItemRoute}`

        mfcLinks.push(mfcLink)
      }

      if (await page.$('results-count > .results-count-pages > a.nav-next')) {
        await page.click('results-count > .results-count-pages > a.nav-next')
        await page.waitForNavigation()
      } else {
        break
      }
    }

    const figures = await Figures.find({
      mfcLink: {
        $in: mfcLinks
      }
    })

    return figures
  } catch (error) {
    console.error('Couldn\'t get figures of user', username, ':', error)
  } finally {
    await browser.close()
  }
}
