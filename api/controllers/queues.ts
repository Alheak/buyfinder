import axios from "axios"
import { JobJson } from 'bullmq'
import { shops } from '../../data/shops'
import redis from "../utils/redisClient"

export async function getServerLoad () {
  try {
    const localPageCount = parseInt((await redis.get('localPageCount')) || '0')
    const serverLoad = localPageCount > 24

    return serverLoad
  } catch (error) {
    console.error('Couldn\'t get server load', error)

    throw new Error('Couldn\'t get server load')
  }
}

export async function getQueues () {
  try {
    const res = await axios.get(`http://localhost:8000/getQueues`)
    const queues = await res.data as { [key: string]: JobJson[] }

    return queues
  } catch (error) {
    console.error('Couldn\'t get queues', error)

    throw new Error('Error trying to get queues')
  }
}

export async function clearQueues () {
  try {
    for (let i = 0; i < Object.keys(shops).length; i++) {
      const shop = Object.keys(shops)[i]
      const queue = await axios.get(`http://localhost:8000/clearQueue?shop=${shop}`)
    }

    await axios.get(`http://localhost:8000/clearFiguresQueue`)
  } catch (error) {
    console.error('Couldn\'t clear queues', error)
  }
}
