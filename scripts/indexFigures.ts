import mongoose from "mongoose"
import Figures from "../api/models/Figure"
import connectDB from "../api/utils/connectDB"
import elasticClient from "../api/utils/elasticClient"
import getDocForIndexing from "../api/utils/getDocForIndexing"

(async () => {
  connectDB()

  if (await elasticClient.indices.exists({ index: 'figures' })) {
    await elasticClient.indices.delete({
      index: 'figures'
    })
  }

  await elasticClient.indices.create({
    index: 'figures',
    body: {
      settings: {
        analysis: {
          analyzer: {
            buyfinder_analyzer: {
              tokenizer: 'buyfinder_tokenizer',
              filter: [
                "lowercase"
              ],
              type: 'custom'
            }
          },
          tokenizer: {
            buyfinder_tokenizer: {
              type: 'edge_ngram',
              min_gram: 2,
              max_gram: 10,
              token_chars: [
                'letter',
                'digit'
              ]
            }
          }
        },
        max_ngram_diff: 10
      },
      mappings: {
        properties: {
          id: {
            type: 'keyword'
          },
          name: {
            type: 'text',
            analyzer: 'buyfinder_analyzer',
            search_analyzer: 'standard'
          },
          slug: {
            type: 'keyword'
          },
          title: {
            type: 'text',
            analyzer: 'buyfinder_analyzer',
            search_analyzer: 'standard'
          },
          char: {
            type: 'text',
            analyzer: 'buyfinder_analyzer',
            search_analyzer: 'standard'
          },
          version: {
            type: 'text',
            analyzer: 'buyfinder_analyzer',
            search_analyzer: 'standard'
          },
          origin: {
            type: 'text',
            analyzer: 'buyfinder_analyzer',
            search_analyzer: 'standard'
          },
          manufacturer: {
            type: 'text',
            analyzer: 'buyfinder_analyzer',
            search_analyzer: 'standard'
          },
          classification: {
            type: 'text',
            analyzer: 'buyfinder_analyzer',
            search_analyzer: 'standard'
          },
          category: {
            type: 'text',
            analyzer: 'buyfinder_analyzer',
            search_analyzer: 'standard'
          },
          scale: {
            type: 'text'
          },
          image: {
            type: 'keyword',
            index: false
          },
          releases: {
            type: 'nested',
            properties: {
              date: {
                type: 'date',
                index: false
              }
            }
          },
          jp: {
            type: 'nested',
            properties: {
              title: {
                type: 'text',
                analyzer: 'buyfinder_analyzer',
                search_analyzer: 'standard'
              },
              char: {
                type: 'text',
                analyzer: 'buyfinder_analyzer',
                search_analyzer: 'standard'
              },
              version: {
                type: 'text',
                analyzer: 'buyfinder_analyzer',
                search_analyzer: 'standard'
              },
              origin: {
                type: 'text',
                analyzer: 'buyfinder_analyzer',
                search_analyzer: 'standard'
              },
              manufacturer: {
                type: 'text',
                analyzer: 'buyfinder_analyzer',
                search_analyzer: 'standard'
              },
              classification: {
                type: 'text',
                analyzer: 'buyfinder_analyzer',
                search_analyzer: 'standard'
              }
            }
          },
          priceData: {
            type: 'nested',
            properties: {
              searchCount: {
                type: 'integer',
                index: false
              },
              averagePrice: {
                type: 'double',
                index: false
              },
              minPrice: {
                type: 'double',
                index: false
              },
              maxPrice: {
                type: 'double',
                index: false
              },
              priceChange: {
                type: 'double',
                index: false
              }
            }
          },
          createdAt: {
            type: 'date',
            index: false
          }
        }
      }
    }
  })

  const figures = await Figures.find()

  for (let i = 0; i < figures.length; i++) {
    const figure = figures[i]
    const document = await getDocForIndexing(figure)

    // console.log('document', document)

    await elasticClient.index({
      index: 'figures',
      document
    })
  }

  await elasticClient.close()

  mongoose.connections[mongoose.connections.length - 1].close()
})()
