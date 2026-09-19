import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  figure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'figures',
    required: true
  },
  title: String,
  shop: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'JPY'
  },
  condition: {
    type: String,
    enum: ["new", "used"],
    required: true,
    default: 'new'
  },
  seller: String,
  url: {
    type: String,
    required: true
  },
  priceIsTBD: Boolean,
  isAccurate: Boolean,
  isActive: Boolean,
  isWrong: Boolean,
  searchUsed: String
}, {
  timestamps: true
})

const Listing = mongoose.models.listings || mongoose.model('listings', schema)

export default Listing
