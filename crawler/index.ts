import express, { Request, Response } from 'express'
import dotenv from 'dotenv'
import { Queue, QueueEvents, Job, JobJson } from 'bullmq'
import { WorkerJob, ListingWorkerJob, FigureWorkerJob, MfcLinkWorkerJob } from '../types/WorkerJob'
import { shops } from '../data/shops'
import redis from '../api/utils/redisClient'

dotenv.config()

const app = express()

app.use(express.json())

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD
}

const queues: { [key: string]: Queue<any, any, string> } = {
  listingsQueue: new Queue('listingsQueue', {
    connection: redisOptions,
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: true
    }
  }),
  figuresQueue: new Queue('figuresQueue', {
    connection: redisOptions,
    // defaultJobOptions: {
    //   attempts: 1,
    //   removeOnComplete: true,
    //   removeOnFail: true
    // }
  }),
  mfcLinksQueue: new Queue('mfcLinksQueue', {
    connection: redisOptions,
    // defaultJobOptions: {
    //   attempts: 2,
    //   removeOnComplete: true,
    //   removeOnFail: true
    // }
  })
}

const events: { [key: string]: QueueEvents } = {
  listingsEvent: new QueueEvents(queues.listingsQueue.name, {
    connection: redisOptions
  }),
  figuresEvent: new QueueEvents(queues.figuresQueue.name, {
    connection: redisOptions
  }),
  mfcLinksEvent: new QueueEvents(queues.mfcLinksQueue.name, {
    connection: redisOptions
  })
}

const activeJobs: { [key: string]: Map<string, string> } = {}

for (const shop in shops) {
  if (Object.prototype.hasOwnProperty.call(shops, shop)) {
    const queueName = `${shop}Queue`

    queues[queueName] = new Queue(queueName, {
      connection: redisOptions,
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: true
      }
    })

    const eventsName = `${shop}Events`

    events[eventsName] = new QueueEvents(queueName, {
      connection: redisOptions
    })

    activeJobs[shop] = new Map()
  }
}

app.post('/getListings', async (req: Request, res: Response) => {
  try {
    const data: WorkerJob = { type: 'listings', ...req.body }
    const figureId = data.figure._id.toString()
    const shop = shops[data.shop].mirrorShop || data.shop
    const queueName = `${shop}Queue`
    const eventsName = `${shop}Events`
    const queue = queues[queueName]
    const queueEvents = events[eventsName]
    const figuresInQueue = activeJobs[shop]

    let jobId = figuresInQueue.get(figureId)

    if (jobId) {
      // console.log(`A job for ${figureId} in ${shop} already exists: #${jobId}`)
    } else {
      const localPageCount = parseInt((await redis.get('localPageCount')) || '0')

      // console.log('Current local page count:', localPageCount)

      if (localPageCount > 18) data.useCloud = true

      const newJob = await Job.create(queue, shop, data, {
        priority: data.priority || 1
      })

      jobId = newJob.id as string

      figuresInQueue.set(figureId, jobId)

      // console.log(`Job #${jobId} received: ${data.shop}/${data.figure.name || data.figure._id.toString()}`)
    }

    queueEvents.on('completed', async ({ jobId: completedJobId }) => {
      if (completedJobId !== jobId) return

      figuresInQueue.delete(figureId)

      const result = await Job.fromId(queue, completedJobId)

      // console.log(`Job #${jobId} for ${figureId} in ${shop} completed: `, result?.returnvalue)

      if (result) res.status(200).json(result.returnvalue)
    })

    queueEvents.on('failed', async ({ jobId: failedJobId, failedReason }) => {
      if (failedJobId !== jobId) return

      figuresInQueue.delete(figureId)

      console.error(`Job #${jobId} for ${figureId} in ${shop} failed: `, failedReason)

      res.status(500).end()
    })
  } catch (error) {
    console.error('An error occured during a crawling job: ', error)

    res.status(500).end()
  }
})

const listingsQueueEvents = new QueueEvents(queues.listingsQueue.name, {
  connection: redisOptions
})

const listingsInQueue = new Map()

app.post('/checkListing', async (req: Request, res: Response) => {
  try {
    const data: ListingWorkerJob = { type: 'listing', ...req.body }
    const mapKey = data.listing.url
    let jobId = listingsInQueue.get(mapKey)

    if (jobId) {
      // console.log(`A job for listing ${mapKey} already exists: #${jobId}`)
    } else {
      const newJob = await Job.create(queues.listingsQueue, 'listings', data)

      jobId = newJob.id

      listingsInQueue.set(mapKey, jobId)

      // console.log(`Job #${jobId} received for listing ${data.listing.url}`)
    }

    listingsQueueEvents.on('completed', async ({ jobId: completedJobId }) => {
      if (completedJobId !== jobId) return

      listingsInQueue.delete(mapKey)

      const result = await Job.fromId(queues.listingsQueue, completedJobId)

      // console.log(`Job #${jobId} completed: `, result?.returnvalue)

      if (result) res.status(200).json(result.returnvalue)
    })

    listingsQueueEvents.on('failed', async ({ jobId: failedJobId, failedReason }) => {
      if (failedJobId !== jobId) return

      listingsInQueue.delete(mapKey)

      console.error(`Job #${jobId} failed: `, failedReason)

      res.status(500).end()
    })
  } catch (error) {
    console.error('An error occured during a crawling job: ', error)

    res.status(500).end()
  }
})

const figuresQueueEvents = new QueueEvents(queues.figuresQueue.name, {
  connection: redisOptions
})

const figuresInQueue = new Map()

app.post('/getFigureInfo', async (req: Request, res: Response) => {
  try {
    const data: FigureWorkerJob = { type: 'figure', ...req.body }
    const mapKey = data.mfcLink

    let jobId = figuresInQueue.get(mapKey)

    if (jobId) {
      // console.log(`A job for figure ${mapKey} already exists: #${jobId}`)
    } else {
      const newJob = await Job.create(queues.figuresQueue, 'figures', data)

      jobId = newJob.id

      figuresInQueue.set(mapKey, jobId)

      // console.log(`Job #${jobId} received for figure ${data.mfcLink}`)
    }

    figuresQueueEvents.on('completed', async ({ jobId: completedJobId }) => {
      if (completedJobId !== jobId) return

      figuresInQueue.delete(mapKey)

      const result = await Job.fromId(queues.figuresQueue, completedJobId)

      // console.log(`Job #${jobId} completed: `, result?.returnvalue)

      if (result) res.status(200).json(result.returnvalue)
    })

    figuresQueueEvents.on('failed', async ({ jobId: failedJobId, failedReason }) => {
      if (failedJobId !== jobId) return

      figuresInQueue.delete(mapKey)

      console.error(`Job #${jobId} failed: `, failedReason)

      res.status(500).end()
    })
  } catch (error) {
    console.error('An error occured during a scraping job: ', error)

    res.status(500).end()
  }
})

const mfcLinksQueueEvents = new QueueEvents(queues.mfcLinksQueue.name, {
  connection: redisOptions
})

const mfcLinksInQueue = new Map()

app.post('/getMfcLink', async (req: Request, res: Response) => {
  try {
    const data: MfcLinkWorkerJob = { type: 'mfcLink', ...req.body }
    const mapKey = data.jan

    let jobId = mfcLinksInQueue.get(mapKey)

    if (jobId) {
      // console.log(`A job for mfcLink ${mapKey} already exists: #${jobId}`)
    } else {
      const newJob = await Job.create(queues.mfcLinksQueue, 'mfcLinks', data)

      jobId = newJob.id

      mfcLinksInQueue.set(mapKey, jobId)

      // console.log(`Job #${jobId} received for jan ${data.jan}`)
    }

    mfcLinksQueueEvents.on('completed', async ({ jobId: completedJobId }) => {
      if (completedJobId !== jobId) return

      mfcLinksInQueue.delete(mapKey)

      const result = await Job.fromId(queues.mfcLinksQueue, completedJobId)

      // console.log(`Job #${jobId} completed: `, result?.returnvalue)

      if (result) res.status(200).json(result.returnvalue)
    })

    mfcLinksQueueEvents.on('failed', async ({ jobId: failedJobId, failedReason }) => {
      if (failedJobId !== jobId) return

      mfcLinksInQueue.delete(mapKey)

      console.error(`Job #${jobId} failed: `, failedReason)

      res.status(500).end()
    })
  } catch (error) {
    console.error('An error occured during a MFC link job: ', error)

    res.status(500).end()
  }
})

app.get('/getQueues', async (req: Request, res: Response) => {
  const jobs: { [key: string]: JobJson[] } = {
    active: [],
    delayed: [],
    waiting: []
  }

  const queueNames = [
    ...Object.keys(shops).map(shop => `${shop}Queue`),
    'listingsQueue',
    'figuresQueue',
    'mfcLinksQueue'
  ]

  for (let i = 0; i < queueNames.length; i++) {
    const queueName = queueNames[i]
    const queue = queues[queueName]

    try {
      const activeJobs = (await queue.getActive()).map(job => job.asJSON())
      const delayedJobs = (await queue.getDelayed()).map(job => job.asJSON())
      const waitingJobs = (await queue.getWaiting()).map(job => job.asJSON())

      jobs.active = [...jobs.active, ...activeJobs]
      jobs.delayed = [...jobs.delayed, ...delayedJobs]
      jobs.waiting = [...jobs.waiting, ...waitingJobs]
    } catch (error) {
      console.error('An error occured trying to get the queue', queueName, ':', error)
    }
  }

  res.status(200).json(jobs)

  return
})

app.get('/clearQueue', async (req: Request, res: Response) => {
  if (!req.query.shop) {
    res.status(500).end()

    return
  }

  try {
    const queueName = `${req.query.shop}Queue`
    const queue = queues[queueName]

    await queue.drain(true)

    res.status(200).end()

    return 
  } catch (error) {
    console.error('An error occured trying to clear the queue for shop', req.query.shop, ':', error)

    res.status(500).end()
  }
})

app.get('/clearFiguresQueue', async (req: Request, res: Response) => {
  try {
    const queue = queues.figuresQueue

    await queue.drain(true)

    res.status(200).end()

    return 
  } catch (error) {
    console.error('An error occured trying to clear the figures queue:', error)

    res.status(500).end()
  }
})

app.listen(8000, () => {
  // console.log('Crawler listening on port 8000')
})
