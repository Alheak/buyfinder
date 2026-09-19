import axios from 'axios'
import redis from '../utils/redisClient'

export default async function getExchangeRates (currency: String = 'JPY') {
  currency = currency.toUpperCase()

  const redisKey = `rates-${currency}`

  let rates: { [key: string]: number } = {}

  try {
    if (await redis.exists(redisKey)) {
      rates = JSON.parse(await redis.get(redisKey) || '{}')
  
      return rates
    }

    const res = await axios({
      method: 'get',
      url: `https://v6.exchangerate-api.com/v6/${process.env.REACT_APP_EXCHANGE_RATES_DATA_API_KEY}/latest/${currency}`,
      timeout: 5000
    })

    const {data} = res

    if (!data.conversion_rates) throw new Error('No exchange rates')

    rates = data.conversion_rates

    await redis.set(redisKey, JSON.stringify(rates), "EX", 60 * 60 * 24)
    await redis.set(redisKey + '_last', JSON.stringify(rates))
  } catch (error) {
    console.error("Couldn't get the exchange rates", error)

    rates = JSON.parse(await redis.get(redisKey + '_last') || '{}')
  }

  return rates
}
