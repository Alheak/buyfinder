import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { signIn } from '../../../api/controllers/users'
import Users from '../../../api/models/User'
import Notifications from '../../../api/models/Notification'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      type: 'credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'text',
          placeholder: 'Email address'
        },
        password: {
          label: 'Password',
          type: 'password',
          placeholder: 'Password'
        }
      },
      async authorize (credentials) {
        if (!credentials) return null

        const { email, password } = credentials
        const user = await signIn(email, password)

        if (user.activated === false) throw new Error('Account is not activated')

        return user
      }
    })
  ],
  callbacks: {
    async jwt ({ token, user }) {
      if (!user) return token

      const userDoc = await Users.findById(user._id)

      if (user) {
        const notificationCount = await Notifications.countDocuments({
          user: userDoc._id,
          isRead: {
            $ne: true
          }
        })

        token.id = userDoc._id.toString()
        token.email = userDoc.email
        token.hasActiveSubscription = !!userDoc.hasActiveSubscription
        token.subscriptionLevel = userDoc.subscriptionLevel
        token.watchPoints = userDoc.watchPoints
        token.watchPointsSubscription = userDoc.watchPointsSubscription
        token.notificationCount = notificationCount

        if (!!userDoc.admin) token.admin = true
      }

      return token
    },
    async session ({ session, token }) {
      const user = await Users.findById(token.id)

      if (user) {
        const notificationCount = await Notifications.countDocuments({
          user: user._id,
          isRead: {
            $ne: true
          }
        })

        session.user.id = user._id.toString()
        session.user.email = user.email
        session.user.hasActiveSubscription = !!user.hasActiveSubscription
        session.user.subscriptionLevel = user.subscriptionLevel
        session.user.watchPoints = user.watchPoints
        session.user.watchPointsSubscription = user.watchPointsSubscription
        session.user.notificationCount = notificationCount

        if (!!user.admin) session.user.admin = true
      }

      return session
    }
  }
}

export default NextAuth(authOptions)
