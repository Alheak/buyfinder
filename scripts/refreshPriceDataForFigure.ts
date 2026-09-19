import mongoose from "mongoose"
import Figures from "../api/models/Figure"
import redis from "../api/utils/redisClient"
import connectDB from "../api/utils/connectDB"
import { Figure } from "../types/Figure"
import elasticClient from "../api/utils/elasticClient"
import updateFigureCacheWithPriceData from "../api/utils/updateFigureCacheWithPriceData"

(async () => {
  if (process.argv.length < 3) {
    console.error('Please provide a figure _id.')

    process.abort()
  }

  connectDB()

  const _id = process.argv[2]

  let figure: Figure | null = await Figures.findById(_id).lean() as any

  if (!figure) {
    console.error('No figure found')

    await redis.quit()

    process.abort()
  }

  await updateFigureCacheWithPriceData(figure, true)

  await redis.quit()

  await elasticClient.close()

  mongoose.connections[mongoose.connections.length - 1].close()
})()
