import { Types } from "mongoose"
import NextAuth, { DefaultUser, DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User extends DefaultUser {
    _id: Types.ObjectId
    email: string
    hasActiveSubscription?: boolean
    subscriptionLevel?: number
    remainingActiveSearches?: number
    watchPoints?: number
    watchPointsSubscription?: boolean
    admin?: boolean
    notificationCount?: number
  }

  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session extends DefaultSession {
    user: User
  }
}

declare module "next-auth/jwt" {
  interface JWT extends User {}
}
