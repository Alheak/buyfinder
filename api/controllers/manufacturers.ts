import Figures from "../models/Figure"

export async function getManufacturersNames () {
  try {
    const figures = await Figures.find({ $and: [{ manufacturer: { $exists: true } }, { manufacturer: { $ne: '' } }] }).sort({ manufacturer: 'asc' })
    const manufacturers = figures.map(figure => figure.manufacturer)

    return [...(new Set(manufacturers))]
  } catch (error) {
    console.error("Couldn't fetch manufacturers", error)

    return []
  }
}
