import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  shop: {
    type: String,
    required: true
  },
  error: {
    type: String,
    required: true
  },
  usingProxy: Boolean
}, {
  timestamps: true
})

const Error = mongoose.models.errors || mongoose.model('errors', schema)

export default Error
