import mongoose from 'mongoose'
import connectDB from "../api/utils/connectDB"
import Prices from '../api/models/Price'

(async () => {
  connectDB()

  const prices = await Prices.find({ currency: { $regex: /[a-z]+/ } })

  for (let i = 0; i < prices.length; i++) {
    const price = prices[i]

    // console.log('price.currency', price.currency)
    
    price.currency = price.currency.toUpperCase()

    await price.save()

    // console.log('price.currency', price.currency)
  }
  
  mongoose.connections[mongoose.connections.length - 1].close()
})()
