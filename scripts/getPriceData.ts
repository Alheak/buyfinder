import mongoose from "mongoose"
import Figures from "../api/models/Figure"
import redis from "../api/utils/redisClient"
import connectDB from "../api/utils/connectDB"
import elasticClient from "../api/utils/elasticClient"
import updateFigureCacheWithPriceData from "../api/utils/updateFigureCacheWithPriceData"

(async () => {
  connectDB()

  let figures = await Figures.find()

  if (!figures || !figures.length) {
    console.error('No figures found')

    await redis.quit()

    process.abort()
  }

  for (let i = 0; i < figures.length; i++) {
    const figure = figures[i]

    try {
      await updateFigureCacheWithPriceData(figure, true)
    } catch (error) {
      console.error('Something went wrong when calculating price data for', figure._id, error)
    }
  }

  await redis.quit()

  await elasticClient.close()

  mongoose.connections[mongoose.connections.length - 1].close()
})()
