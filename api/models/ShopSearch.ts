import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  shop: {
    type: String,
    required: true
  },
  figure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'figures',
    required: true
  },
  search: {
    type: String,
    required: true
  }
}, {
  timestamps: true
})

const ShopSearch = mongoose.models.shopSearches || mongoose.model('shopSearches', schema)

export default ShopSearch
