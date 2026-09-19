import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'listings',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  }
}, {
  timestamps: true
})

const Price = mongoose.models.prices || mongoose.model('prices', schema)

export default Price
