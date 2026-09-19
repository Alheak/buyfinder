import { NextApiRequest, NextApiResponse } from "next"
import { getServerLoad } from "../../../api/controllers/queues"

export default async function handler (req: NextApiRequest, res: NextApiResponse<boolean>) {
  try {
    const serverLoad: boolean = await getServerLoad()

    res.status(200).json(serverLoad)
  } catch (error) {
    console.error('Error when getting server load', error)

    res.status(500).end()
  }
}
