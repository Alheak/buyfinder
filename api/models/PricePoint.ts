import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  figure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'figures',
    required: true
  },
  price: {
    type: Number,
    required: false
  },
  yearMonth: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    enum: ['all', 'used', 'new'],
    required: true,
    default: 'all'
  },
  percentile: {
    type: Number,
    required: false
  },
  shop: {
    type: String,
    required: false
  }
}, {
  timestamps: true
})

const PricePoint = mongoose.models.pricePoints || mongoose.model('pricePoints', schema)

export default PricePoint
