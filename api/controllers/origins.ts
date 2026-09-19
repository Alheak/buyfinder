import Origins from "../models/Origin"

export async function getOriginsNames () {
  try {
    const origins = await Origins.find().sort({ name: 'asc' })

    return [...new Set(origins.map(origin => origin.name))]
  } catch (error) {
    console.error("Couldn't fetch origins", error)

    return []
  }
}
