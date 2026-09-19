import { ElementHandle, HTTPResponse, Page } from 'rebrowser-puppeteer'
import { barcodeRegex } from "../../mixins/barcodeRegex"
import { Figure } from "../../types/Figure"
import { SearchTerm, Shop } from "../../types/Shops"

async function pageContentPreparation (page: Page, response: HTTPResponse | null, searchUrl: string, shop: Shop, search?: string) {
  if (shop.localStorage) {
    await page.evaluate((items) => {
      for (let i = 0; i < Object.keys(items).length; i++) {
        const key = Object.keys(items)[i]
        const value = items[key]

        localStorage.set(key, value)
      }
    }, shop.localStorage)
  }

  if (shop.waitForTimeout) {
    // console.log('Waiting', shop.waitForTimeout, 'ms for the page to load...')

    await new Promise((resolve) => {
      setTimeout(resolve, shop.waitForTimeout)
    })
  }

  if (shop.waitForNavigation) {
    // console.log('Waiting for the page to navigate...')

    try {
      await page.waitForNavigation({ timeout: 5000 })
    } catch (error) {
      console.error('Couldn\'t wait for the page to navigate', error)
    }
  }

  let errorRetries = 0

  while (!!response && response.status() >= 500 && response.status() <= 599 && errorRetries < 3) {
    errorRetries++

    response = await page.reload()
  }

  if (!response) {
    console.error('No response from the browser for url', searchUrl)

    throw new Error('No response from browser')
  }

  if (response.status() !== 404 && response.status() >= 400 && response.status() <= 599) {
    console.error(`Page is responding with status ${response.status()}`, 'at url', searchUrl)

    throw new Error(`Page error status ${response.status()} at url: ${searchUrl}`)
  }

  if (shop.waitForSelector) {
    // console.log('Waiting for selector', shop.waitForSelector)

    try {
      await page.waitForSelector(shop.waitForSelector, { timeout: 5000 })
    } catch (error) {
      console.error('Couldn\'t wait for the page to navigate', error)
    }
  }

  if (!!shop.visitFirstClickSelector) {
    const clickElement = await page.waitForSelector(shop.visitFirstClickSelector, {
      timeout: 4000
    }) as ElementHandle<HTMLElement> | null

    if (!clickElement) throw new Error("Visit URL selector not found.")

    await clickElement.evaluate(el => el.click())

    try {
      await page.waitForNavigation({ timeout: 5000 })
    } catch (error) {
      
    }
  }

  if (!!shop.visitFirstUrl) await page.goto(searchUrl)

  if (shop.name === 'Amazon JP') {
    // console.log('Trying to set the postal code')

    try {
      const currentZip = await page.waitForSelector('#nav-global-location-slot #nav-global-location-popover-link #glow-ingress-line2', { timeout: 1000 })
      const hasCustomZip = await currentZip?.evaluate(button => /153\-0061/.test(button.textContent || ''))
  
      if (!hasCustomZip) {
        await page.click('#nav-global-location-slot #nav-global-location-popover-link')
        await new Promise(resolve => setTimeout(resolve, 2000))
  
        const input1 = await page.waitForSelector('#GLUXZipInputSection #GLUXZipInputSectionFieldset input#GLUXZipUpdateInput_0', { timeout: 1000 })
        const input2 = await page.waitForSelector('#GLUXZipInputSection #GLUXZipInputSectionFieldset input#GLUXZipUpdateInput_1', { timeout: 1000 })
  
        await input1?.evaluate(input => input.value = '153')
        await input2?.evaluate(input => input.value = '0061')
  
        await page.waitForSelector('#GLUXZipInputSection input.a-button-input', { timeout: 1000 })
        await page.click('#GLUXZipInputSection input.a-button-input')
  
        await new Promise(resolve => setTimeout(resolve, 1000))
  
        await page.waitForSelector('#GLUXConfirmClose', { timeout: 1000 })
        await page.click('#GLUXConfirmClose')
  
        await page.waitForNavigation({ timeout: 2000 })

        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // console.log('Postal code set')
    } catch (error) {
      console.error('Cannot set the postal code:', error)
    }
  } else if (shop.name === 'Amazon US') {
    // console.log('Trying to set the postal code')

    try {
      const currentZip = await page.waitForSelector('#nav-global-location-slot #nav-global-location-popover-link #glow-ingress-line2', { timeout: 1000 })
      const hasCustomZip = await currentZip?.evaluate(button => /11222/.test(button.textContent || ''))
  
      if (!hasCustomZip) {
        await page.click('#nav-global-location-slot #nav-global-location-popover-link')
        await new Promise(resolve => setTimeout(resolve, 2000))

        const input = await page.waitForSelector('#GLUXZipInputSection input.GLUX_Full_Width', { timeout: 2000 })

        await input?.evaluate(input => input.value = '11222')

        await page.waitForSelector('#GLUXZipInputSection input.a-button-input', { timeout: 1000 })
        await page.click('#GLUXZipInputSection input.a-button-input')

        await new Promise(resolve => setTimeout(resolve, 1000))

        await page.waitForSelector('#GLUXConfirmClose', { timeout: 1000 })
        await page.click('#GLUXConfirmClose')

        await page.waitForNavigation({ timeout: 2000 })

        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // console.log('Postal code set')
    } catch (error) {
      console.error('Cannot set the postal code')
    }
  }

  if (shop.requiresClick) {
    // console.log('Clicking on the page to activate it')

    await page.mouse.click(1920 / 2, 900 / 2)
  }

  if (shop.clickSelectors) {
    const clickOnElement = async (clickSelector: string) => {
      // console.log('Trying to click on', clickSelector)

      await page.waitForSelector(clickSelector, {
        timeout: 2000
      })

      const elements = await page.$$(clickSelector)

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as ElementHandle<HTMLElement>

        if (shop.clickHidden === false) {
          const isHidden = await element.evaluate(el => el.hidden)
          const elDisplay = await element.evaluate(el => el.style.display)
          const elVisibility = await element.evaluate(el => el.style.visibility)
          const elOpacity = await element.evaluate(el => el.style.opacity)
      
          if (
            isHidden ||
            elDisplay === 'none' ||
            elVisibility === 'hidden' ||
            elOpacity === '0'
          ) continue
        }
        
        let href = await element.evaluate(el => el.getAttribute('href'))

        if (href && href !== '#') {
          // console.log('Link found', href)

          if (/^\//.test(href)) href = shop.url + href

          await page.goto(href, { waitUntil: shop.waitUntil || 'networkidle0' })
        } else {
          await element.evaluate(el => el.click())
        }

        try {
          await page.waitForNavigation({ timeout: 5000 })
        } catch (error) {
          
        }

        // console.log('Clicked on', clickSelector)
      }
    }

    for (let j = 0; j < shop.clickSelectors.length; j++) {
      const clickSelector = shop.clickSelectors[j]

      try {
        await clickOnElement(clickSelector)
      } catch (error) {
        console.error(`Selector '${clickSelector}' absent, cannot click it:`, error)
        
        if (!!shop.alternateClickSelectors) {
          const [clickSelectorToMatch, alternateClickSelector, isOnlyJan] = shop.alternateClickSelectors.find(([clickSelectorToMatch]) => clickSelectorToMatch === clickSelector) || []

          if (
            !!alternateClickSelector &&
            isOnlyJan !== undefined &&
            (
              (isOnlyJan && !!search && barcodeRegex.test(search)) ||
              !isOnlyJan
            )
          ) {
            // console.log('Trying alternate click selector', alternateClickSelector)

            try {
              await clickOnElement(alternateClickSelector)
            } catch (error) {
              console.error(`Selector '${alternateClickSelector}' absent, cannot click it.`)
            }
          }
        }
      }
    }
  }

  if (shop.refreshSearchPage) await page.reload()
}

export default async function getPageContent (page: Page, searchUrl: string, shop: Shop, figure: Figure, search?: string) {
  const pageContent = []

  let goToAttempts = 0
  let goToUrl = shop.visitFirstUrl || searchUrl
  let response: HTTPResponse | null = null

  do {
    goToAttempts++

    try {
      response = await page.goto(goToUrl, {
        waitUntil: shop.waitUntil || 'networkidle0',
        timeout: shop.timeout || undefined
      })
    } catch (error) {
      console.error('Error when trying to go to url', goToUrl, ':', error)

      if (goToAttempts < 2) {
        // console.log('Retrying to go to url', goToUrl, '...')

        continue
      }

      throw new Error(`Couldn\'t go to url ${goToUrl}.`)
    }
  } while (!response && goToAttempts < 2)

  let retries = 0

  do {
    await pageContentPreparation(page, response, searchUrl, shop, search)

    if (shop.navigate) {
      for (let j = 0; j < shop.navigate.length; j++) {
        const [selector, term, waitForNavigation] = shop.navigate[j]
        const element = await page.waitForSelector(selector, {
          timeout: 3000
        })

        if (!element) {
          console.error('Cannot find navigation element with selector', selector)

          continue
        }

        if (!term) {
          // console.log('No term, clicking on element with selector', selector)

          const clickElement = element as ElementHandle<HTMLElement>

          try {
            await clickElement.evaluate(el => el.click())

            // console.log('Clicked on element with selector', selector)

            if (waitForNavigation) {
              // console.log('Waiting for navigation on', searchUrl)

              await page.waitForNavigation({ timeout: 5000 })

              // console.log('Waited for navigation on', searchUrl)

              await pageContentPreparation(page, response, searchUrl, shop, search)
            }
          } catch (error) {
            console.error('Cannot click navigation element with selector', selector)
          }

          continue
        }

        const text = figure[term as SearchTerm] || term

        try {
          // console.log('Found text "', text, '" to input into element', selector)

          await page.type(selector, text)

          // console.log('Text "', text, '" input into element', selector)
        } catch (error) {
          console.error('Cannot input navigation element with selector', selector, 'and text', text)
        }
      }
    }

    retries++
  } while (
    (
      (!!shop.retryForSelector && !(await page.$(shop.retryForSelector))) ||
      (!!shop.retryIfSelector && (await page.$(shop.retryIfSelector)))
    ) && retries < 3
  )

  if (shop.abortIfSelector) {
    // console.log('Looking for abort selector', shop.abortIfSelector)

    try {
      await page.waitForSelector(shop.abortIfSelector, { timeout: 1000 })

      // console.log('Abort selector found, skipping')

      return []
    } catch (error) {
      console.error('No abort selector found')
    }
  }

  if (shop.shadowRoots) {
    const shadowElement = await page.evaluate((selectors) => {
      let element: Element = document.querySelector('body') || new Element()

      for (let j = 0; j < selectors.length; j++) {
        const [shadowSelector, elementSelector] = selectors[j]
        const newElement = (element.querySelector(shadowSelector)?.shadowRoot || document).querySelector(elementSelector)
        
        if (newElement) element = newElement
      }

      return element.innerHTML
    }, shop.shadowRoots)

    return [shadowElement]
  }

  if (shop.pageContentsClickSelector) {
    const results = await page.$$(shop.pageContentsClickSelector)

    if (!results.length) pageContent.push(await page.content())

    for (let i = 0; i < results.length; i++) {
      const result = results[i] as ElementHandle<HTMLElement>
      
      await result.evaluate(resultElement => resultElement.click())

      pageContent.push(await page.content())
    }
  } else {
    pageContent.push(await page.content())
  }

  return pageContent
}
