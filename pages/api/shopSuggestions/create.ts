import { NextApiRequest, NextApiResponse } from "next"
import getUserFromSession from '../../../api/utils/getUserFromSession'
import { createShopSuggestion } from "../../../api/controllers/shopSuggestions"
import { ShopSuggestion } from "../../../types/ShopSuggestion"

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getUserFromSession(req, res)
    const url = req.body.url
    const shopSuggestion: ShopSuggestion | null = await createShopSuggestion(user, url)

    res.status(200).json({ shopSuggestionStatus: !!shopSuggestion ? 'created' : 'exists' })

    return
  } catch (error) {
    console.error('Error when creating shop suggestion', error)

    res.status(500).end()

    return
  }
}
