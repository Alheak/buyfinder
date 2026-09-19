import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  figure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'figures',
    required: true
  },
  shop: {
    type: String,
    required: true
  }
}, {
  timestamps: true
})

const NoHit = mongoose.models.nohits || mongoose.model('nohits', schema)

export default NoHit
