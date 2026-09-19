// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { confirmReport } from '../../../api/controllers/reports'
import type { Report } from '../../../types/Report'
import getUserFromSession from '../../../api/utils/getUserFromSession'

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<Report>
) {
  try {
    const user = await getUserFromSession(req, res)

    if (!user || !user.admin) {
      res.status(403).end()

      return
    }

    const { _id, isConfirmed, attributePoints, deductPoints, reason } = req.body
    const report: Report = await confirmReport(_id, isConfirmed, attributePoints, deductPoints, reason)

    if (report) {
      res.status(200).json(report)

      return
    }

    res.status(404).end()

    return
  } catch (error) {
    console.error(error)

    res.status(500).end()

    return
  }
}
