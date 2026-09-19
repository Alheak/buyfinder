import mongoose from 'mongoose'
import slug from 'slug'

export default async function generateSlug (stringToSlug: string, Model: mongoose.Model<any, {}, {}, {}, any, any>) {
  let sluggedString = slug(stringToSlug)
  let slugAlreadyExists = await Model.findOne({slug: sluggedString})

  while (slugAlreadyExists = await Model.findOne({slug: sluggedString})) {
    if (!/\-([0-9]+)$/.test(sluggedString)) {
      sluggedString = `${sluggedString}-2`
    } else {
      sluggedString = sluggedString.replace(/\-([0-9]+)$/, (match, number) => `-${parseInt(number) + 1}`)
    }
  }

  return sluggedString
}
