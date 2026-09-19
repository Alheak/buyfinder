import { NextApiRequest } from "next"

export default function checkRequestOrigin (req: NextApiRequest) {
  const referer = req.headers.referer?.replace(/http(s)?\:\/\//, '').split('/')[0]
  const domain = (process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL)?.replace(/http(s)?\:\/\//, '')

  return referer === domain
}
