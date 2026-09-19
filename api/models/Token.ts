import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  data: String
}, {
  timestamps: true
})

const Token = mongoose.models.tokens || mongoose.model('tokens', schema)

export default Token
