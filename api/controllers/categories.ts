import Figures from "../models/Figure"

export async function getCategoriesNames () {
  try {
    const figures = await Figures.find({ $and: [{ category: { $exists: true } }, { category: { $ne: '' } }] }).sort({ category: 'asc' })
    const categories = figures.map(figure => figure.category)

    return [...(new Set(categories))]
  } catch (error) {
    console.error("Couldn't fetch categories", error)

    return []
  }
}
