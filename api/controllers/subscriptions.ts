import Stripe from "stripe"
import { User } from "../../types/User"
import Users from "../models/User"
import sendMail from "../utils/sendMail"

export async function subscriptionStatus (user: User) {
  try {
    const userInstance = await Users.findById(user._id)

    return {
      hasActiveSubscription: !!userInstance.hasActiveSubscription,
      subscriptionLevel: userInstance.subscriptionLevel
    }
  } catch (error) {
    console.error('An error occured trying to get the user\'s subscription status', error)

    throw new Error('An error occured trying to get the user\'s subscription status')
  }
}

export async function upgradeSubscription (user: User) {
  try {
    const userInstance = await Users.findById(user._id)
    const customerId = userInstance.stripeCustomerId

    if (!customerId || !userInstance.hasActiveSubscription) throw new Error('User has no active subscription.')

    if (userInstance.subscriptionLevel !== 1) throw new Error('User cannot upgrade the subscription.')

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' })
    const { data: subscriptions } = await stripe.subscriptions.search({
      query: 'status:\'active\''
    })
    const subscription = subscriptions.find(subscription => subscription.customer === customerId)

    if (!subscription) {
      console.error('Can\'t find any active subscription for user', user)

      throw new Error('Can\'t find any active subscription for user')
    }

    const subscriptionItem = subscription.items.data[0]

    if (!subscriptionItem) {
      console.error('Can\'t find the subscription\'s item', subscription)

      throw new Error('Can\'t find the subscription\'s item')
    }

    const price = process.env.STRIPE_SUBSCRIPTION_PRICE_ID || ''

    await stripe.subscriptions.update(
      subscription.id,
      {
        cancel_at_period_end: false,
        items: [{
          id: subscriptionItem.id,
          price
        }]
      }
    )

    await Users.findOneAndUpdate({ _id: user._id }, { subscriptionLevel: 2 })
  } catch (error) {
    console.error('An error occured trying to upgrade the subscription for user', user, error)

    throw new Error('An error occured trying to upgrade the subscription')
  }
}

export async function updateSubscription (subscription: Stripe.Subscription) {
  try {
    const userInstance = await Users.findOne({ stripeCustomerId: subscription.customer })
    const isActive = subscription.status === 'active'
    const wasSubscribed = !!userInstance.hasActiveSubscription

    // console.log('Updating subscription of user', userInstance._id.toString(), 'to', isActive)

    let level = isActive ? 1 : 0
    
    userInstance.hasActiveSubscription = isActive
    userInstance.subscriptionLevel = level

    await userInstance.save()

    if (!wasSubscribed && isActive) {
      try {
        await sendMail({
          subject: 'buyfinder - Premium Subscription',
          text: `
            Hello,
  
            We send you this email to notify you that buyfinder Premium and its features have been successfully enabled on your account.
            You can manage your subcription at the following url: ${process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_LINK}
  
            If you have any issue or question, do not hesitate to reply to this email.
  
            Thank you for your support!
          `,
          html: `
            Hello, <br />
            <br />
            We send you this email to notify you that buyfinder Premium and its features have been successfully enabled on your account.<br />
            You can manage your subcription at the following url: <a href="${process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_LINK}">${process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_LINK}</a><br />
            <br />
            If you have any issue or question, do not hesitate to reply to this email.<br />
            <br />
            Thank you for your support!
          `
        }, userInstance)
      } catch (error) {
        console.error('Couldn\'t send Premium subscription email', error)
      }
    }
  } catch (error) {
    console.error('An error occured trying to update the subscription', subscription, error)

    throw new Error('An error occured trying to update the subscription')
  }
}
