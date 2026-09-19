import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  domain: {
    type: String,
    required: true
  }
}, {
  timestamps: true
})

const ShopSuggestion = mongoose.models.shopSuggestions || mongoose.model('shopSuggestions', schema)

export default ShopSuggestion
