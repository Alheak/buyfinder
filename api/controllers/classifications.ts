import Figures from "../models/Figure"

export async function getClassificationsNames () {
  try {
    const figures = await Figures.find({ $and: [{ classification: { $exists: true } }, { classification: { $ne: '' } }] }).sort({ classification: 'asc' })
    const classifications = figures.map(figure => figure.classification)

    return [...(new Set(classifications))]
  } catch (error) {
    console.error("Couldn't fetch classifications", error)

    return []
  }
}
