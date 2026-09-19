import { NextApiRequest, NextApiResponse } from "next"
import getUserFromSession from '../../../api/utils/getUserFromSession'
import { createReport } from "../../../api/controllers/reports"
import { Report } from "../../../types/Report"

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getUserFromSession(req, res)
    const forwarded = req.headers["x-forwarded-for"] as string
    const ip = forwarded ? forwarded.split(/, /)[0] : req.socket.remoteAddress

    const report: Report | null = await createReport(req.body, user, ip)

    res.status(200).json({ reportStatus: !!report ? 'created' : 'exists' })

    return
  } catch (error) {
    console.error('Error when creating report', error)

    res.status(500).end()

    return
  }
}
