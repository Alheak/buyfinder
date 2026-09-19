import Redis from "ioredis"

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  enableReadyCheck: true
})

redis.on('ready', () => {
  console.error('Redis is ready')
})

redis.on('error', (error) => {
  console.error('Redis error:', error)
})

export default redis
