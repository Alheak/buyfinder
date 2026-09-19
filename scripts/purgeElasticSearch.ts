import mongoose from "mongoose"
import connectDB from "../api/utils/connectDB"
import elasticClient from "../api/utils/elasticClient"

(async () => {
  connectDB()

  if (await elasticClient.indices.exists({ index: 'figures' })) {
    await elasticClient.indices.delete({
      index: 'figures'
    })
  }

  await elasticClient.close()

  mongoose.connections[mongoose.connections.length - 1].close()
})()
