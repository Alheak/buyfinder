import puppeteer from 'rebrowser-puppeteer'
import * as cheerio from 'cheerio'
import axios from "axios"
import type { FigureInfos } from '../../types/Figure'
import connectDB from './connectDB'
import { shops } from '../../data/shops'
import redis from '../utils/redisClient'
import browserOptions from '../../crawler/utils/browserOptions'

connectDB()

export async function getInfosFromAmiAmi (jan: string) {
  const browser = await puppeteer.launch(browserOptions)

  try {
    const page = await browser.newPage()

    await page.goto(`https://www.amiami.com/eng/search/list/?s_keywords=${jan}`)

    const content = await page.content()

    let $ = cheerio.load(content)

    const firstResultLink = $('.newly-added-items__item:first-child > a').attr('href')

    if (!firstResultLink) throw new Error("Can't find the figure on AmiAmi")

    const figureInfo: FigureInfos = {
      name: '',
      title: '',
      char: '',
      chars: [],
      origin: '',
      version: '',
      classification: '',
      numbering: '',
      manufacturer: '',
      image: '',
      scale: '',
      mfcLink: '',
      releases: [],
      jp: {
        title: '',
        char: '',
        version: '',
        origin: '',
        manufacturer: '',
        classification: ''
      }
    }

    figureInfo.name = $('.newly-added-items__item:first-child .newly-added-items__item__name').text().replace(/^\[[^\[\]]+\]/, '').trim()

    const url = /amiami\.com/.test(firstResultLink) ? firstResultLink : 'https://www.amiami.com' + firstResultLink

    let cookies = shops['amiami'].cookies

    if (cookies && cookies.length) await page.setCookie(...cookies)

    await page.goto(url)

    await page.waitForSelector('.item-about', { timeout: 1000 })

    const pageContent = await page.content()

    $ = cheerio.load(pageContent)

    figureInfo.image = $('.item-detail__image ul.item-detail__slider li a img').attr('src')

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const releaseDateRegex = new RegExp(`(${months.join('|')})\-20[0-9]{2}$`)
    const release = {
      date: ($('.item-about:nth-child(2) .item-about__data:nth-child(2) dd.item-about__data-text:nth-of-type(1)').text().match(releaseDateRegex) || [''])[0].trim(),
      price: parseFloat(
        $('.item-about:nth-child(2) .item-about__data:nth-child(2) dd.item-about__data-text:nth-of-type(2)').text().replace(/[^0-9]/g, '') ||
        $('.item-detail .item-detail__price .item-detail__price_selling-price').text().replace(/[^0-9]/g, '')
      ),
      currency: 'JPY',
      jan: $('.item-about:nth-child(2) .item-about__data:nth-child(3) dd.item-about__data-text:nth-of-type(2)').text().trim()
    }
    const [month, year] = release.date.split('-')
    const monthNumber = months.indexOf(month) + 1

    release.date = `${year}/${monthNumber < 10 ? '0' + monthNumber : monthNumber}`

    figureInfo.releases.push(release)

    let offset = 0

    const hasManufacturer = $('.item-about:nth-child(2) .item-about__data:nth-child(4) .item-about__data-title').text().includes('Brand')

    if (hasManufacturer) {
      figureInfo.manufacturer = $('.item-about:nth-child(2) .item-about__data:nth-child(4) .item-about__data-text').text().trim()

      offset++
    }

    const hasClassification = $(`.item-about:nth-child(2) .item-about__data:nth-child(${4 + offset}) .item-about__data-title`).text().includes('Product Line')

    if (hasClassification) {
      figureInfo.classification = $(`.item-about:nth-child(2) .item-about__data:nth-child(${4 + offset}) .item-about__data-text .item-about__data-gray:first-child`).text().trim()

      offset++
    }

    const hasOrigin = $(`.item-about:nth-child(2) .item-about__data:nth-child(${4 + offset}) .item-about__data-title`).text().includes('Series Title')

    if (hasOrigin) {
      figureInfo.origin = $(`.item-about:nth-child(2) .item-about__data:nth-child(${4 + offset}) .item-about__data-text`).text().trim()

      const betweenParentheses = (/\(([^\(\)]+)\)$/.exec(figureInfo.origin) || [])[1]

      if (betweenParentheses) figureInfo.origin = betweenParentheses

      offset++
    }

    const hasChar = $(`.item-about:nth-child(2) .item-about__data:nth-child(${4 + offset}) .item-about__data-title`).text().includes('Character')

    if (hasChar) {
      figureInfo.char = $(`.item-about:nth-child(2) .item-about__data:nth-child(${4 + offset}) .item-about__data-text`).text().trim()

      const betweenParentheses = (/\(([^\(\)]+)\)$/.exec(figureInfo.char) || [])[1]

      if (betweenParentheses) figureInfo.char = betweenParentheses

      offset++
    }

    const hasSculptor = $(`.item-about:nth-child(2) .item-about__data:nth-child(${4 + offset}) .item-about__data-title`).text().includes('Sculptor')

    if (hasSculptor) offset++

    figureInfo.scale = ($(`.item-about:nth-child(2) .item-about__data:nth-child(${5 + offset}) .item-about__data-text`).text().match(/Scale\: ([0-9]\/[0-9])/) || [])[1]

    if (figureInfo.char) {
      let version = figureInfo.name.split('Complete Figure')[0]

      if (version.includes(figureInfo.char)) version = version.split(figureInfo.char)[1]
      if (figureInfo.scale && version.includes(figureInfo.scale)) version = version.split(figureInfo.scale)[0]

      if (!version) {
        version = figureInfo.name.split('Complete Figure')[0]

        if (figureInfo.origin && version.includes(figureInfo.origin)) version = version.split(figureInfo.origin)[1]
        if (version.includes(figureInfo.char)) version = version.split(figureInfo.char)[0]
      }

      version = version.trim()

      if (version) figureInfo.version = version
    } else {
      let title = figureInfo.name.split('Complete Figure')[0]

      if (figureInfo.origin && title.includes(figureInfo.origin)) title = title.split(figureInfo.origin)[1]
      if (figureInfo.scale && title.includes(figureInfo.scale)) title = title.split(figureInfo.scale)[0]

      title = title.trim()

      if (title) {
        figureInfo.title = title
        figureInfo.char = title
      }
    }

    if (figureInfo.char) figureInfo.name = [figureInfo.origin, figureInfo.char, figureInfo.version, figureInfo.scale, figureInfo.classification, figureInfo.manufacturer ? `(${figureInfo.manufacturer})` : ''].filter(spec => !!spec).join(' - ')

    const jpUrl = url.replace('https://www.amiami.com/eng/detail/', 'https://www.amiami.jp/top/detail/detail')

    cookies = shops['amiamijp'].cookies

    if (cookies && cookies.length) await page.setCookie(...cookies)

    await page.goto(jpUrl, {
      waitUntil: 'networkidle0'
    })

    const jpPageContent = await page.content()

    $ = cheerio.load(jpPageContent)

    figureInfo.jp.manufacturer = $('dl.spec_data dd.brand').text().trim()
    figureInfo.jp.origin = $('dl.spec_data dd.originaltitle .originaltitle_list:first-child').text().trim()
    figureInfo.jp.char = $('dl.spec_data dd.charactername').text().trim()
    figureInfo.jp.classification = $('dl.spec_data dd.seriestitle').text().trim()

    return figureInfo
  } catch (error) {
    console.error('Something went wrong trying to fetch figure infos from AmiAmi', error)

    return null
  } finally {
    await browser.close()
  }
}

export async function getMfcLink (jan: string, timeout: number = 1000 * 60 * 2, retryUntil: number = 1000 * 60 * 2 + Date.now()): Promise<string | null> {
  const redisKey = `mfcLink_${jan}`

  if (await redis.exists(redisKey)) {
    const link = await redis.get(redisKey)

    return link
  }

  // console.log('Attempting to find a MFC entry for JAN', jan)

  try {
    const { data } = await axios({
      method: 'post',
      url: 'http://localhost:8000/getMfcLink',
      timeout,
      data: {
        jan
      }
    })

    return data as string
  } catch (error: any) {
    if (Date.now() < retryUntil) {
      console.error(`Error when getting MFC link with JAN ${jan} but retrying:`, error)

      await new Promise(resolve => setTimeout(resolve, 2000))

      return await getMfcLink(jan, timeout, retryUntil)
    }

    console.error(`Error when getting MFC link with JAN ${jan}:`, error)

    await redis.set(redisKey, '', 'EX', 60 * 60 * 24 * 7)

    return null
  }
}

export async function getFigureInfos (link: string, timeout: number = 1000 * 60 * 2, retryUntil = 1000 * 60 * 2 + Date.now()): Promise<FigureInfos> {
  try {
    const { data } = await axios({
      method: 'post',
      url: 'http://localhost:8000/getFigureInfo',
      timeout,
      data: {
        mfcLink: link
      }
    })

    return data as FigureInfos
  } catch (error: any) {
    if (Date.now() < retryUntil) {
      console.error(`Error when getting figure info with url ${link} but retrying:`, error)

      await new Promise(resolve => setTimeout(resolve, 2000))

      return await getFigureInfos(link, timeout, retryUntil)
    }

    console.error(`Error when getting figure info with url ${link}:`, error)

    throw new Error('Error when getting figure info')
  }
}
