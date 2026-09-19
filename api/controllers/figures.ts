import redis from '../utils/redisClient'
import { Figure, FigureInfos, Release } from '../../types/Figure'
import type { User } from '../../types/User'
import connectDB from '../utils/connectDB'
import Figures from '../models/Figure'
import Watches from '../models/Watch'
import Searches from '../models/Search'
import { getMfcLink, getFigureInfos } from '../utils/getFigureInfos'
import { barcodeRegex } from '../../mixins/barcodeRegex'
import getFiguresByCount from '../utils/getFiguresByCount'
import elasticClient from "../utils/elasticClient"
import { Types } from "mongoose"
import getDocForIndexing from '../utils/getDocForIndexing'
import { QueryDslQueryContainer, SearchRequest, Sort } from '@elastic/elasticsearch/lib/api/types'
import { FilterQuery } from 'mongoose'
import generateSlug from '../utils/generateSlug'

connectDB()

export async function createFigure (figureInfo: FigureInfos) {
  try {
    const figureSlug = barcodeRegex.test(figureInfo.name) ? undefined : await generateSlug(`${(figureInfo.category || 'unknown')} ${figureInfo.name}`, Figures)
    const figure = await Figures.create({
      ...figureInfo,
      slug: figureSlug
    })

    try {
      const doc = await getDocForIndexing(figure)

      // console.log('Creating indexed document', doc)

      await elasticClient.index({
        index: 'figures',
        document: doc
      })
    } catch (error) {
      console.error('Couldn\'t index the figure', figure, error)
    }

    const figureRedisKey = `figure_${figure._id.toString()}`

    await redis.set(figureRedisKey, JSON.stringify(figure), 'EX', 60 * 60 * 24 * 7)

    return figure
  } catch (error) {
    console.error('Couldn\'t create the figure', figureInfo, error)
  }
}

export async function updateFigure (_id: Types.ObjectId) {
  try {
    const figure = await Figures.findById(_id)

    if (!figure.mfcLink) return figure

    const figureInfo = await getFigureInfos(figure.mfcLink)

    if (!figureInfo.image) delete figureInfo.image

    Object.assign(figure, figureInfo)

    if (!figure.slug) {
      const figureSlug = await generateSlug(`${(figure.category || 'unknown')} ${figure.name}`, Figures)

      figure.slug = figureSlug
    }

    await figure.save()

    try {
      const result = await elasticClient.search({
        index: 'figures',
        query: {
          match: {
            id: {
              query: figure._id.toString()
            }
          }
        }
      })

      const doc = await getDocForIndexing(figure)

      if (result && result.hits.hits[0]._id) {
        const indexedDocId = result.hits.hits[0]._id

        // console.log('Updating indexed document', indexedDocId, doc)

        await elasticClient.update({
          index: 'figures',
          id: indexedDocId,
          body: {
            doc
          }
        })
      } else {
        // console.log('Creating indexed document', doc)

        await elasticClient.index({
          index: 'figures',
          document: doc
        })
      }
    } catch (error) {
      console.error('Couldn\'t update the indexed figure', figure, error)
    }

    const figureRedisKey = `figure_${figure._id.toString()}`

    await redis.set(figureRedisKey, JSON.stringify(figure), 'EX', 60 * 60 * 24 * 7)

    return figure
  } catch (error) {
    console.error('Couldn\'t update the figure', _id, error)
  }
}

export async function searchFigures (
    search: string,
    filters: QueryDslQueryContainer[] = [],
    size: number = 10000,
    page?: number,
    sort: Sort = [{ _score: { order: 'desc' }}],
    cancelIfNoQuery: boolean = true
  ) {
  if (!search && cancelIfNoQuery) return []

  const searchRequest: SearchRequest = {
    index: 'figures',
    query: {
      bool: {
        must: [
          search ?
            {
              multi_match: {
                query: search,
                fields: [
                  'title^4',
                  'char^4',
                  'version^3',
                  'manufacturer^3',
                  'name^2',
                  'origin^2',
                  'classification^2',
                  'category^2',
                  'scale',
                  'jp.title^2',
                  'jp.char^2',
                  'jp.version',
                  'jp.origin',
                  'jp.manufacturer',
                  'jp.classification'
                ],
                type: 'cross_fields',
                operator: 'and',
                auto_generate_synonyms_phrase_query: false
              }
            } :
            {
              match_all: {}
            },
            ...filters
        ]
      }
    },
    sort
  }

  if (size) {
    searchRequest.size = size

    if (page) searchRequest.from = page * size
  }

  try {
    const result = await elasticClient.search(searchRequest)

    const figures = []

    for (let i = 0; i < result.hits.hits.length; i++) {
      const figure: any = result.hits.hits[i]._source
      
      if (figure) {
        figure._id = new Types.ObjectId(figure.id)

        figures.push(figure)
      }
    }

    return figures
  } catch (error) {
    console.error(error)

    throw new Error('Couldn\'t search figures')
  }
}

export async function getFigureFromMFCLink (mfcLink: string) {
  try {
    let figure = await Figures.findOne({ mfcLink })

    if (!figure) {
      const figureInfo = await getFigureInfos(mfcLink)

      figure = await createFigure(figureInfo)
    }

    return figure
  } catch (error) {
    console.error('Error trying to get figure from MFC link', mfcLink, ':', error)

    throw new Error('Couldn\'t get figure from MFC link')
  }
}

export async function getFigureFromJan (jan: string) {
  try {
    const query: FilterQuery<any> = { $or: [{ name: jan }, { releases: { $elemMatch: { jan }} }]}
    const mfcLink = await getMfcLink(jan)

    if (mfcLink && query.$or) query.$or.push({ mfcLink })

    let figure = await Figures.findOne(query)

    if (figure) {
      if (!figure.mfcLink && mfcLink) updateFigure(figure._id)

      return figure
    }

    try {
      const redisKey = `figure_jan_${jan}`

      if (await redis.exists(redisKey)) {
        const figure = JSON.parse(await redis.get(redisKey) || 'null')

        return figure
      }

      let figureInfos = null
      
      if (mfcLink) figureInfos = await getFigureInfos(mfcLink)

      if (!figureInfos) figureInfos = {
        name: jan,
        releases: [{ jan }],
        jp: {}
      }

      figure = await createFigure(figureInfos)

      await redis.set(redisKey, JSON.stringify(figure), 'EX', 60 * 60 * 24 * 7)

    } catch (error) {
      console.error('Couldn\'t get figure from JAN', jan, 'where figure doesn\'t exist', error)

      throw new Error('Couldn\'t get figure from JAN')
    }

    return figure
  } catch (error) {
    console.error('Error trying to get figure from JAN', jan, ':', error)

    throw new Error('Couldn\'t get figure from JAN')
  }
}

export async function getFigure(_id: string, user?: User | null, useCache: boolean = true) {
  let figure = null

  if (/[\w\-]+/.test(_id)) {
    figure = await Figures.findOne({ slug: _id })

    if (figure) _id = figure._id.toString()
  }

  let watch = null

  if (user) {
    try {
      const watchRedisKey = `watches_${user._id.toString()}_${_id}`

      if (await redis.exists(watchRedisKey)) {
        watch = JSON.parse(await redis.get(watchRedisKey) || 'null')
      } else {
        watch = await Watches.findOne({ user: user._id, figure: _id })
      }
    } catch (error) {
      console.error(`Couldn\'t get the watch for user ${user?._id} and figure ${_id}.`)
    }
  }

  const figureRedisKey = `figure_${_id}`

  if (await redis.exists(figureRedisKey) && useCache) {
    try {
      const cachedFigure: Figure = JSON.parse(await redis.get(figureRedisKey) || '')

      cachedFigure._id = new Types.ObjectId(cachedFigure._id)
      cachedFigure.watch = watch

      return cachedFigure
    } catch (error) {
      console.error(`Couldn\'t get cache for figure ${_id}.`)
    }
  }

  try {
    if (!figure) figure = await Figures.findById(_id)
    if (!figure) {
      if (!barcodeRegex.test(_id)) throw new Error('Figure not found')

      figure = await getFigureFromJan(_id)

      if (!figure) throw new Error('Figure not found')
    }

    figure = JSON.parse(JSON.stringify(figure))

    let mfcLink = figure.mfcLink

    if (!mfcLink) {
      const jan = figure.releases.find((release: Release) => !!release.jan)?.jan || (barcodeRegex.test(figure.name) ? figure.name : '')

      try {
        if (jan) mfcLink = await getMfcLink(jan)
      } catch (error) {
        console.error('Couldn\'t get MFC link for figure', figure, error)
      }
    }

    if (mfcLink) {
      // const figureInfo = await getFigureInfos(mfcLink)

      // figure = JSON.parse(JSON.stringify(await updateFigure(figure._id, figureInfo)))
      updateFigure(figure._id)
    }

    figure.watch = watch

    return figure
  } catch (error) {
    console.error("Can't get the figure", error)

    throw new Error("Can't get the figure")
  }
}

export async function getFigures (searchParams: { [key: string]: string }, sort = 'added', order: ('asc' | 'desc') = 'desc', page = 0, limit = 40) {
  try {
    const FILTERS = [
      'category',
      'classification',
      'origin',
      'manufacturer'
    ]

    const SORTING_TYPES = {
      added: 'createdAt',
      release: 'releases.date',
      popularity: 'priceData.searchCount',
      averagePrice: 'priceData.averagePrice',
      minPrice: 'priceData.minPrice',
      maxPrice: 'priceData.maxPrice',
      priceChange: 'priceData.priceChange'
    } as const

    const searchFilters: QueryDslQueryContainer[] = []

    for (let i = 0; i < FILTERS.length; i++) {
      const FILTER = FILTERS[i]
      const value = searchParams[FILTER]
      
      if (value) searchFilters.push({
        match: {
          [FILTER]: {
            query: value,
            operator: 'AND'
          }
        }
      })
    }

    const sortingType = SORTING_TYPES[sort as keyof typeof SORTING_TYPES]
    const searchSort = sort === 'added' ? [{ [sortingType]: order }] : [{ [sortingType]: { nested: { path: sortingType.split('.')[0] }, order} }]

    const indexedFigures = await searchFigures(searchParams.search || '', searchFilters, limit, page, searchSort, false)
    // const figures = []

    // for (let i = 0; i < indexedFigures.length; i++) {
    //   const indexedFigure = indexedFigures[i]
    //   const figure = await Figures.findById(indexedFigure._id)
    //   const updatedFigure = await updateFigureCacheWithPriceData(figure)

    //   figures.push(updatedFigure)
    // }

    return indexedFigures
  } catch (error) {
    console.error("Can't get figures", error)

    throw new Error("Can't get figures")
  }
}

export async function getMostSearchedFigures () {
  const redisKey = `mostSearchedFigures`

  try {
    if (await redis.exists(redisKey)) {
      const figures = JSON.parse(await redis.get(redisKey) || '[]')

      return figures
    }

    const from = new Date(Date.now() - 1000 * 60 * 60 * 24)
    const figures = await getFiguresByCount(Searches, from)

    await redis.set(redisKey, JSON.stringify(figures))

    return figures
  } catch (error) {
    console.error("Can't get most searched figures", error)

    throw new Error("Can't get most searched figures")
  }
}

export async function getMostWatchedFigures () {
  const redisKey = `mostWatchedFigures`

  try {
    if (await redis.exists(redisKey)) {
      const figures = JSON.parse(await redis.get(redisKey) || '[]')

      return figures
    }

    const from = new Date(Date.now() - 1000 * 60 * 60 * 24)
    const figures = await getFiguresByCount(Watches, from)

    await redis.set(redisKey, JSON.stringify(figures))

    return figures  
  } catch (error) {
    console.error("Can't get most watched figures", error)

    throw new Error("Can't get most watched figures")
  }
}
