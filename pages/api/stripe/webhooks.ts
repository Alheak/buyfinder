import { NextApiRequest, NextApiResponse } from "next"
import Stripe from 'stripe'
import { buffer } from 'micro'
import { updateSubscription } from "../../../api/controllers/subscriptions"
import { updateWatchPoints, updateWatchPointsSubscription } from "../../../api/controllers/watches"

export const config = {
  api: {
    bodyParser: false,
  }
}

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end('Only POST requests are allowed.')

    return
  }

  const signature = req.headers['stripe-signature']

  if (!signature) {
    res.status(400).end("Missing Stripe signature header.")

    return
  }

  let event

  try {
    event = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' })
      .webhooks.constructEvent(
        await buffer(req),
        signature,
        process.env.STRIPE_WEBHOOK_SIGNING_SECRET || ''
      )
  } catch (error) {
    console.error(error)

    res.status(400).end("Wrong signature.")

    return
  }

  const WATCH_POINTS_SUBSCRIPTIONS = [
    process.env.STRIPE_150000_WATCH_POINTS_RECURRING_PRICE_ID,
    process.env.STRIPE_300000_WATCH_POINTS_RECURRING_PRICE_ID,
    process.env.STRIPE_450000_WATCH_POINTS_RECURRING_PRICE_ID
  ]

  // console.log('WATCH_POINTS_SUBSCRIPTIONS', WATCH_POINTS_SUBSCRIPTIONS)

  try {
    // console.log('Received new Stripe event:', event)
    // console.log('Processing the event object:', event.data.object)

    if (event.type.includes('customer.subscription')) {
      // console.log('Subscription has the following plan:', (event.data.object as Stripe.Subscription).items.data[0])
    }

    if (
      event.type.includes('customer.subscription') &&
      (event.data.object as Stripe.Subscription).items.data[0].plan.id === process.env.STRIPE_SUBSCRIPTION_PRICE_ID
    ) {
      const subscription = event.data.object as Stripe.Subscription

      // console.log('New subscription event', subscription)

      await updateSubscription(subscription)

      res.status(200).end()

      return
    }

    if (
      event.type.includes('customer.subscription') &&
      WATCH_POINTS_SUBSCRIPTIONS.includes((event.data.object as Stripe.Subscription).items.data[0].plan.id)
    ) {
      const subscription = event.data.object as Stripe.Subscription

      // console.log('New watch points subscription event', subscription)

      await updateWatchPointsSubscription(subscription)
    } 
    
    if (event.type === 'payment_intent.succeeded') {
      const object = event.data.object as Stripe.PaymentIntent

      // console.log('New watch points purchase event', object)

      await updateWatchPoints(object.customer || '', object.amount as 599 | 999 | 1399)
    }

    res.status(200).end()
  } catch (error) {
    console.error(error)

    res.status(500).end()
  }
}
