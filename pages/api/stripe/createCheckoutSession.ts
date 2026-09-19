import { NextApiRequest, NextApiResponse } from "next"
import getUserFromSession from "../../../api/utils/getUserFromSession"
import { createCheckoutSession } from "../../../api/controllers/stripe"


export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getUserFromSession(req, res)

    if (!user) {
      res.status(401).end()
  
      return
    }

    const { type, amount, recurring } = req.body
    const session = await createCheckoutSession(user, type, amount, recurring)

    res.status(200).send(session.url)
  } catch (error) {
    console.error(error)

    res.status(500).end()
  }
}
