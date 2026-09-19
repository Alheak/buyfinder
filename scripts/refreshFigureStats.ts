import mongoose from 'mongoose'
import redis from '../api/utils/redisClient'
import getFiguresByCount from "../api/utils/getFiguresByCount"
import Searches from "../api/models/Search"
import Watches from "../api/models/Watch"
import elasticClient from "../api/utils/elasticClient"
import connectDB from "../api/utils/connectDB"

(async () => {
  connectDB()

  const mostSearchedRedisKey = `mostSearchedFigures`
  const mostWatchedRedisKey = `mostWatchedFigures`

  const searchesFrom = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
  const watchesFrom = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)

  const mostSearchedFigures = await getFiguresByCount(Searches, searchesFrom)
  const mostWatchedFigures = await getFiguresByCount(Watches, watchesFrom)

  await redis.set(mostSearchedRedisKey, JSON.stringify(mostSearchedFigures))
  await redis.set(mostWatchedRedisKey, JSON.stringify(mostWatchedFigures))

  await redis.quit()

  await elasticClient.close()

  mongoose.connections[mongoose.connections.length - 1].close()
})()
