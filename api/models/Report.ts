import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'listings'
  },
  figure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'figures'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  shop: String,
  type: {
    type: String,
    enum: ["falseNegative", "falsePositive"],
    required: true,
    default: 'falsePositive'
  },
  reason: {
    type: String,
    enum: ['wrong', 'bootleg', 'broken', 'soldout', 'price', 'condition', 'info', 'other'],
    required: false,
    default: 'wrong'
  },
  comment: String,
  searchSuggestion: String,
  isConfirmed: Boolean,
  fromIp: {
    type: String,
    required: false,
    default: null
  },
}, {
  timestamps: true
})

const Report = mongoose.models.reports || mongoose.model('reports', schema)

export default Report
