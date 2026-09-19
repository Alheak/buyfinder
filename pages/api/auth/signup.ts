// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { User } from 'next-auth'
import { createUser } from '../../../api/controllers/users'
import redis from '../../../api/utils/redisClient'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<User>
) {
  try {
    const forwarded = req.headers["x-forwarded-for"] as string
    const ip = forwarded ? forwarded.split(/, /)[0] : req.socket.remoteAddress

    const signupCount = parseInt(await redis.get(`signup_ip_${ip}`) || '0')

    if (signupCount > 3) {
      res.status(400).end()

      return
    } else {
      signupCount === 0
        ? await redis.set(`signup_ip_${ip}`, '1', 'EX', 60 * 60 * 24)
        : await redis.incr(`signup_ip_${ip}`)
    }

    const { email, password } = req.body
    const user = await createUser(email, password)

    res.status(200).json(user)

    return
  } catch (error: any) {
    console.error('Error during sign-up:', error)

    // if (error.message === 'Email already in use') {
    //   res.status(400).end()

    //   return
    // }

    res.status(500).end()

    return
  }
}
