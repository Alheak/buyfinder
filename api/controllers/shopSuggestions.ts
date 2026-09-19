import extractDomain from 'extract-domain'
import { User } from "../../types/User"
import ShopSuggestions from "../models/ShopSuggestion"

export async function createShopSuggestion (user: User, url: string) {
  try {
    if (user.activated !== undefined && !user.activated) throw new Error(`Account ${user.email} is not activated`)

    if (!/^http(s)?\:\/\//.test(url)) url = 'https://' + url

    const domain = await extractDomain(url, { tld: true })

    // console.log('Found domain', domain, 'from url', url)

    const hasAlreadySuggested = await ShopSuggestions.findOne({ user: user._id, domain })

    if (!!hasAlreadySuggested) return null

    const shopSuggestion = await ShopSuggestions.create({ user: user._id, domain })

    return shopSuggestion
  } catch (error) {
    console.error(`Something went wrong trying to create a new shop suggestion for user ${user.email} and url ${url}`, error)

    throw new Error(`Something went wrong trying to create a new shop suggestion`)
  }
}
