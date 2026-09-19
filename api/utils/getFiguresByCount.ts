import mongoose, { PipelineStage } from "mongoose"
import { getFigure } from "../controllers/figures"
import updateFigureCacheWithPriceData from "./updateFigureCacheWithPriceData"

export default async function getFiguresByCount (Model: mongoose.Model<any, {}, {}, {}, any, any>, from?: Date) {
  const aggregate: PipelineStage[] = []

  if (from) {
    aggregate.push({
      $match: { createdAt: { $gte: from } }
    })
  }

  aggregate.push({
    $group: { _id: '$figure', count: { $sum: 1 } }
  })

  aggregate.push({
    $sort: { count: -1 }
  })

  const figuresByCount = await Model.aggregate(aggregate)

  const figures = []

  for (let i = 0; i < Math.min(5, figuresByCount.length); i++) {
    const { _id } = figuresByCount[i]

    let figure = await getFigure(_id.toString())

    if (figure) {
      figure = await updateFigureCacheWithPriceData(figure)

      figures.push(figure)
    }
  }

  return figures  
}
