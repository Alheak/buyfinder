import { NextApiRequest, NextApiResponse } from "next"
import { getReports } from "../../../api/controllers/reports"
import getUserFromSession from "../../../api/utils/getUserFromSession"
import { Report } from "../../../types/Report"

export default async function handler (req: NextApiRequest, res: NextApiResponse<Report[]>) {
  try {
    const user = await getUserFromSession(req, res)

    if (!user || !user.admin) {
      res.status(403).end()

      return
    }

    const type = req.query.type as 'falsePositive' | 'falseNegative'
    const reports: Report[] = await getReports(type)

    res.status(200).json(reports)
  } catch (error) {
    console.error('Error when getting reports', error)

    res.status(500).end()
  }
}
