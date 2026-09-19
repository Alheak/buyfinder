import redis from '../utils/redisClient'
import { Figure } from "../../types/Figure"
import getFigurePriceData from './getFigurePriceData'

export default async function updateFigureCacheWithPriceData (figure: Figure, force?: boolean) {
  const priceDataRedisKey = `figure_${figure._id.toString()}_priceData`

  if (force || !(await redis.exists(priceDataRedisKey)) || !figure.priceData) {
    figure.priceData = await getFigurePriceData(figure)

    await redis.set(priceDataRedisKey, '', 'EX', 60 * 60)

    const figureRedisKey = `figure_${figure._id.toString()}`
    const figureRedisTTL = await redis.ttl(figureRedisKey)

    await redis.set(figureRedisKey, JSON.stringify(figure), 'EX', figureRedisTTL > 0 ? figureRedisTTL : 60 * 60 * 24 * 7)
  }

  return figure
}
