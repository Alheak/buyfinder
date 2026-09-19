import { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../pages/api/auth/[...nextauth]"
import { getUser } from "../controllers/users"

export default async function getUserFromSession(req: NextApiRequest, res: NextApiResponse) {
  const session = JSON.parse((req.headers['x-session-token'] as string) || 'null') || await getServerSession(req, res, authOptions)

  if (!session) return null

  const user = await getUser(session.user.email)

  return user
}
