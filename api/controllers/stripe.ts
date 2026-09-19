import Stripe from "stripe"
import { User } from "../../types/User"
import Users from "../models/User"

export async function createCustomer (user: User) {
  try {
    const userInstance = await Users.findById(user._id)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' })
    const customer = await stripe.customers.create({
      email: user.email
    })

    userInstance.stripeCustomerId = customer.id

    await userInstance.save()

    return userInstance
  } catch (error) {
    console.error('An error occured trying to create a new Stripe customer for user', user, error)

    throw new Error('An error occured trying to create a new Stripe customer')
  }
}

export async function createCheckoutSession (user: User, type: 'subscription' | 'watchPoints', amount: 150000 | 300000 | 450000, recurring: boolean) {
  try {
    const userInstance = await Users.findById(user._id)

    if (type === 'subscription' && userInstance.hasActiveSubscription) throw new Error('User already has an active subscription.')

    const price: string = (
      type === 'subscription'
        ? process.env.STRIPE_SUBSCRIPTION_PRICE_ID
        : process.env[`STRIPE_${amount}_WATCH_POINTS${recurring ? '_RECURRING' : ''}_PRICE_ID`]
      ) || ''

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' })
    const customer = userInstance.stripeCustomerId || (await createCustomer(user)).stripeCustomerId
    const origin = (process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL) || ''
    const session = await stripe.checkout.sessions.create({
      mode: type === 'subscription' || recurring ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      customer,
      line_items: [
        {
          price,
          quantity: 1
        }
      ],
      success_url: `${origin}/post-checkout.html?success=true`,
      cancel_url: `${origin}/post-checkout.html?cancelled=true`
    })

    return session
  } catch (error) {
    console.error('An error occured trying to create a new checkout session of type', type, 'for user', user, error)

    throw new Error('An error occured trying to create a new checkout session')
  }
}

export async function cancelSubscription (subscriptionId: string) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' })

    await stripe.subscriptions.cancel(subscriptionId)

    // console.log('Subscription', subscriptionId, 'has been successfully cancelled.')
  } catch (error) {
    console.error('An error occured trying to cancel the subscription', subscriptionId, ':', error)
  }
}
