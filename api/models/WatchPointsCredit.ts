import mongoose, { Schema } from 'mongoose'

const schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    enum: ["report", "purchase", "abuse"]
  }
}, {
  timestamps: true
})

const WatchPointsCredit = mongoose.models.watchPointsCredit || mongoose.model('watchPointsCredit', schema)

export default WatchPointsCredit
