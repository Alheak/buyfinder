import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  slug: String,
  category: String,
  title: String,
  numbering: String,
  char: String,
  chars: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'characters'
  }],
  version: String,
  origin: String,
  manufacturer: String,
  distributor: String,
  sculptor: String,
  image: String,
  releases: [{
    date: String,
    price: Number,
    currency: String,
    jan: String
  }],
  classification: String,
  scale: String,
  mfcLink: String,
  jp: {
    title: String,
    char: String,
    version: String,
    origin: String,
    manufacturer: String,
    distributor: String,
    sculptor: String,
    classification: String
  },
  priceData: {
    searchCount: Number,
    averagePrice: Number,
    minPrice: Number,
    maxPrice: Number,
    priceChange: Number
  }
}, {
  timestamps: true
})

const Figure = mongoose.models.figures || mongoose.model('figures', schema)

export default Figure
